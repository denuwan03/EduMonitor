const TopicApproval = require("../models/TopicApproval");
const Project = require("../models/Project");

exports.createTopicRequest = async (req, res, next) => {
  try {
    const topic = await TopicApproval.create({
      projectTitle: req.body.projectTitle,
      description: req.body.description,
      studentId: req.user._id,
      status: "Pending",
    });
    return res.status(201).json(topic);
  } catch (error) {
    return next(error);
  }
};

exports.getTopicRequests = async (_req, res, next) => {
  try {
    const topics = await TopicApproval.find()
      .populate("studentId", "name email")
      .populate("supervisorId", "name email");
    return res.json(topics);
  } catch (error) {
    return next(error);
  }
};

exports.reviewTopic = async (req, res, next) => {
  try {
    const { status } = req.body;
    const topic = await TopicApproval.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: "Topic not found" });
    topic.status = status;
    topic.supervisorId = req.user._id;
    await topic.save();

    if (status === "Approved") {
      await Project.create({
        title: topic.projectTitle,
        description: topic.description || "Project created from approved topic",
        teamMembers: [topic.studentId],
        supervisor: req.user._id,
      });
    }
    return res.json(topic);
  } catch (error) {
    return next(error);
  }
};
