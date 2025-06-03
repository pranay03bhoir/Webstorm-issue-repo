const Student = require("../models/student.model");
const Attendance = require("../models/attendance.model");
/**
 * The function `updateStudentDetails` updates student details based on the provided fields in the
 * request and returns a success message with the updated student data or an error message if something
 * goes wrong.
 * @param req - The `req` parameter in the `updateStudentDetails` function stands for the request
 * object. It contains information about the HTTP request made to the server, including the request
 * parameters, body, headers, and other details. In this function, `req` is used to extract the student
 * ID from the
 * @param res - The `res` parameter in the `updateStudentDetails` function is the response object that
 * will be used to send back the response to the client making the request. It is typically used to set
 * the status code, send JSON data, or render a view in response to the client's request.
 * @returns The `updateStudentDetails` function returns a JSON response with the following structure:
 */
const updateStudentDetails = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { name, email, contact, address, batches } = req.body;

    // Fetch the current student record
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Prepare the fields to update
    const updateFields = {};

    // Only update fields if they are provided in the request
    if (name) updateFields.name = name;
    if (contact) updateFields.contact = contact;
    if (email) updateFields.email = email;
    if (batches) updateFields.batches = batches;
    if (address) updateFields.address = address;

    // Update the student record with new data
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Details updated successfully.",
      data: updatedStudent,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};
// ADDED FEATURE WHERE ATTENDANCE CANNOT BE ADDED FOR SAME COURSE.
/**
 * The function `addStudentAttendance` handles marking attendance for a student in a specific subject,
 * ensuring no duplicate records for the same day, and updating the student's attendance array
 * accordingly.
 * @param req - The `req` parameter in the `addStudentAttendance` function stands for the request
 * object. It contains information about the HTTP request that triggered the function, including
 * headers, parameters, body, and more. In this case, the function is expecting the request body to
 * contain data about the student, subject
 * @param res - Response object that represents the HTTP response that an Express app sends when it
 * gets an HTTP request. It contains methods to send a response back to the client, such as setting the
 * status code, sending JSON data, or rendering a template.
 * @returns The function `addStudentAttendance` returns a response with status code and JSON data.
 */
const addStudentAttendance = async (req, res) => {
  try {
    const { student, subject, status, note } = req.body;

    if (!student || !subject || !status) {
      return res
        .status(400)
        .json({ message: "student, subject, and status are required." });
    }

    // Normalize today's date to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance already exists for today
    const existing = await Attendance.findOne({
      student,
      subject,
      date: { $gte: today },
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Attendance already marked for today." });
    }

    // Create new attendance record
    const attendance = new Attendance({
      student,
      subject,
      status,
      note: note || "",
    });

    // Save attendance record
    const savedAttendance = await attendance.save();

    // Add the new attendance record to student's attendance array
    // Using $push to append to the array, not replace existing records
    const updatedStudent = await Student.findByIdAndUpdate(
      student,
      {
        $push: {
          // $push adds the new attendance ID to the existing array
          // This preserves all previous attendance records
          attendance: savedAttendance._id,
        },
      },
      {
        new: true, // Return the updated document
        // Don't use $set as it would replace the entire array
      }
    ).populate({
      path: "attendance",
      select: "subject status date",
      populate: {
        path: "subject",
        select: "name",
      },
    });

    if (!updatedStudent) {
      // If student update fails, delete the attendance record to maintain consistency
      await Attendance.findByIdAndDelete(savedAttendance._id);
      return res.status(404).json({
        message: "Student not found. Attendance record not created.",
      });
    }

    // Return both the new attendance record and the student with all attendance records
    res.status(201).json({
      message: "Attendance marked successfully.",
      attendance: savedAttendance,
      student: updatedStudent, // This includes all attendance records, not just the new one
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Server error." });
  }
};
