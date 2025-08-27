const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Hamara Guard
const StudyGroup = require('../models/studyGroupModel');

// Route: GET /api/groups
// Description: Sirf user ke apne groups fetch karein
// Access: Private
router.get('/', protect, async (req, res) => {
    try {
        const groups = await StudyGroup.find({ members: req.user._id })
            .populate('createdBy', 'name')
            .populate('members', 'name'); // Members ki details bhi le aao
        res.status(200).json(groups);
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- NEW ROUTE 1: Discover All Other Groups ---
// Route: GET /api/groups/discover
// Description: Woh saare groups laao jinka user member nahi hai
// Access: Private
router.get('/discover', protect, async (req, res) => {
    try {
        const groups = await StudyGroup.find({ members: { $ne: req.user._id } }) // '$ne' matlab 'not equal to'
            .populate('createdBy', 'name')
            .populate('members', 'name');
        res.status(200).json(groups);
    } catch (error) {
        console.error('Error fetching discoverable groups:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// ---------------------------------------------

// Route: POST /api/groups
// Description: Naya study group banayein
// Access: Private
router.post('/', protect, async (req, res) => {
    const { name, subject, description } = req.body;

    if (!name || !subject || !description) {
        return res.status(400).json({ message: 'Please provide all fields.' });
    }

    try {
        const newGroup = await StudyGroup.create({
            name,
            subject,
            description,
            createdBy: req.user._id,
            members: [req.user._id],
        });

        // Naye group ko populate karke bhejo taaki frontend par aasaani ho
        const populatedGroup = await StudyGroup.findById(newGroup._id)
            .populate('createdBy', 'name')
            .populate('members', 'name');

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- NEW ROUTE 2: Join a Group ---
// Route: POST /api/groups/:id/join
// Description: Ek group ko join karein
// Access: Private
router.post('/:id/join', protect, async (req, res) => {
    try {
        const group = await StudyGroup.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        // Check karo ki user pehle se member toh nahi hai
        if (group.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'You are already a member of this group.' });
        }

        group.members.push(req.user._id); // User ki ID ko members array me daal do
        await group.save();

        const updatedGroup = await StudyGroup.findById(req.params.id)
            .populate('createdBy', 'name')
            .populate('members', 'name');

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// -----------------------------------

// ... (existing POST /api/groups/:id/join route ke baad)

// --- NEW ROUTE: Delete a Group ---
// Route: DELETE /api/groups/:id
// Description: Ek group ko delete karein
// Access: Private (Sirf group creator hi delete kar sakta hai)
router.delete('/:id', protect, async (req, res) => {
    try {
        const group = await StudyGroup.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        // Sabse zaroori check: Kya logged-in user hi group ka creator hai?
        // group.createdBy ek ObjectId hai, isliye .toString() se compare karenge.
        if (group.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this group.' });
        }

        await group.deleteOne(); // MongoDB v6+ me .remove() ki jagah .deleteOne()
        // ya await StudyGroup.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Group deleted successfully.' });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// -----------------------------------

module.exports = router;