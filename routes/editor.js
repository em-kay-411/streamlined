const express = require('express');
const verifyToken = require('../funcs/verifyToken.js');
const Project = require('../models/project.js');
const Submission = require('../models/submission.js');
const File = require('../models/file.js');
const router = express.Router();
const upload = require('../funcs/uploadSubmission.js');
const downloadFile = require('../funcs/donwloadFile.js');
const downloadArchived = require('../funcs/downloadArchived.js');


// Middleware to authenticate the JWT token
const verifyEditor = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== 'editor') {
            return res.status(403).json({ message: 'You are not authorised' });
        }
        next();
    })
};

router.get('/dashboard', verifyEditor, (req, res) => {
    res.json({ message: 'You have access to the editor dashboard.' });
});

// Editor's Projects
router.get('/projects', verifyEditor, async (req, res) => {
    try {
        const editor = req.user.id;

        const projects = await Project.find({ editors: editor });

        res.status(200).json({ projects });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Project details
router.get('/projects/:id', verifyEditor, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id });
        if (!project.editors.includes(req.user.id)) {
            return res.status(403).json({ message: 'You are not authorised to access this project' });
        }
        if (!project) {
            return res.status(403).json({ message: 'No such project found' });
        }

        // We need not to check the type of the ids. it will just check the ASCII value and go on.
        if (!project.editors.includes(req.user.id)) {
            return res.status(403).json({ message: 'Your are not authorised to access this' });
        }

        res.status(200).json({ project });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Router to submit the project
router.post('/submit/:id', verifyEditor, upload.fields([{name : 'file', maxCount : 1}, {name : 'thumbnail', maxCount : 1}, {name : 'subtitles', maxCount : 1}]), async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id });
        if(!project){
            return res.status(403).json({ message : 'Project not found'});
        }
        if (!project.editors.includes(req.user.id)) {
            return res.status(403).json({ message: 'You are not allowed to submit to this project' });
        }

        // Not working yet
        // let cards = req.body.cards;
        // if (typeof cards === 'string') {
        //     cards = JSON.parse(cards);
        // }
        
        const newSubmission = new Submission({
            project: req.params.id,
            s3url: req.files.file[0].location,
            filename: req.files.file[0].originalname,
            thumbnail_url : req.files.thumbnail[0].location,            
            video_title : req.body.video_title,
            video_description : req.body.video_description,
            privacy : req.body.privacy,
            defaultLanguage : req.body.defaultLanguage,
            isForKids : req.body.isForKids,
            // cards : cards   // Not working yet
        });

        if(req.files.subtitles){
            newSubmission.subtitles_url = req.files.subtitles[0].location
        }

        // Save submission information to MongoDB
        await newSubmission.save();

        project.submissions.push(newSubmission);

        await project.save();

        res.status(201).json({ message: 'Submitted Successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Router to download the entire project data archived using projectID
router.get('/downloadProject/:id', verifyEditor, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id });

        if (!project.editors.includes(req.user.id)) {
            return res.status(403).json({ message: 'You are not allowed to download this content' });
        }

        const files = project.files;
        let fileURLS = [];

        for (const file of files) {
            const doc = await File.findOne({ _id: file });
            fileURLS.push(doc.s3url);
        }

        await downloadArchived(fileURLS, res);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Router to download a file of certain ID
router.get('/download/:id', verifyEditor, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id });
        const project = await Project.findOne({ _id: file.project });

        if (!project.editors.includes(req.user.id)) {
            return res.status(403).json({ message: 'You are not allowed to download this content' });
        }

        const s3FileUrl = file.s3url;
        if (!s3FileUrl) {
            return res.status(400).send('S3 file URL is required as a query parameter.');
        }

        await downloadFile(s3FileUrl, res);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }

})

module.exports = router;
