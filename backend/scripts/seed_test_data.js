const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Submission = require("../models/Submission");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://denuwan:denuwan123@smsdb.g3jchy3.mongodb.net/sms_db?appName=smsdb";

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB...");

    // 1. Create Users
    const hashedPassword = await bcrypt.hash("Test@123", 10);
    
    let student = await User.findOne({ email: "student@test.com" });
    if (!student) {
      student = await User.create({
        userId: "STU001",
        name: "Test Student",
        email: "student@test.com",
        password: hashedPassword,
        role: "Student",
        status: "Active"
      });
      console.log("Student created");
    }

    let supervisor = await User.findOne({ email: "supervisor@test.com" });
    if (!supervisor) {
      supervisor = await User.create({
        userId: "SUP001",
        name: "Test Supervisor",
        email: "supervisor@test.com",
        password: hashedPassword,
        role: "Supervisor",
        status: "Active"
      });
      console.log("Supervisor created");
    }

    // 2. Create Project
    let project = await Project.findOne({ title: "Test Project" });
    if (!project) {
      project = await Project.create({
        title: "Test Project",
        description: "A project for testing dashboards",
        teamMembers: [student._id],
        supervisor: supervisor._id,
        status: "Active"
      });
      console.log("Project created");
    }

    // 3. Create Tasks
    const tasksData = [
      { 
        title: "Literature Review", 
        description: "Submit lit review", 
        deadline: new Date(Date.now() + 86400000 * 7), 
        status: "Completed",
        assignedTo: student._id,
        projectId: project._id
      },
      { 
        title: "System Design", 
        description: "Submit design doc", 
        deadline: new Date(Date.now() - 86400000 * 1), // Yesterday
        status: "Submitted",
        assignedTo: student._id,
        projectId: project._id
      },
      { 
        title: "Implementation Phase 1", 
        description: "Basic features", 
        deadline: new Date(Date.now() + 86400000 * 14), 
        status: "Pending",
        assignedTo: student._id,
        projectId: project._id
      }
    ];

    for (const t of tasksData) {
      const existingTask = await Task.findOne({ title: t.title, projectId: project._id });
      if (!existingTask) {
        await Task.create(t);
        console.log(`Task ${t.title} created`);
      }
    }

    const t1 = await Task.findOne({ title: "Literature Review" });
    const t2 = await Task.findOne({ title: "System Design" });

    // 4. Create Submissions
    const submissionsData = [
      {
        submissionId: "SUB0001",
        project_id: project._id,
        task_id: t1._id,
        student_id: student._id,
        title: "Lit Review Submission",
        description: "Final version",
        studentName: student.name,
        projectName: project.title,
        taskName: t1.title,
        file: "lit-review.pdf",
        file_url: "http://localhost:5000/uploads/lit-review.pdf",
        originalName: "lit-review.pdf",
        status: "Reviewed",
        version: 1,
        marks: 85,
        grade: "A",
        comments: "Excellent work",
        edit_count: 5,
        time_spent: 120,
        submission_time: new Date(Date.now() - 86400000 * 5),
        deadline: t1.deadline
      },
      {
        submissionId: "SUB0002",
        project_id: project._id,
        task_id: t2._id,
        student_id: student._id,
        title: "Design Doc Submission",
        description: "Initial draft",
        studentName: student.name,
        projectName: project.title,
        taskName: t2.title,
        file: "design.pdf",
        file_url: "http://localhost:5000/uploads/design.pdf",
        originalName: "design.pdf",
        status: "Submitted",
        version: 1,
        edit_count: 12,
        time_spent: 200,
        submission_time: new Date(), // Today
        deadline: t2.deadline
      }
    ];

    for (const s of submissionsData) {
      const existingSub = await Submission.findOne({ submissionId: s.submissionId });
      if (!existingSub) {
        await Submission.create(s);
        console.log(`Submission ${s.submissionId} created`);
      }
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
