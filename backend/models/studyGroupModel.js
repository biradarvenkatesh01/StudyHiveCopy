const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of User IDs
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true,
});

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);

module.exports = StudyGroup;