// routes/userRoutes.js
const express = require('express');
const { register, login, setAvatar, getAllUsers, logOut } = require('../controllers/userController');
const axios = require('axios');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/setavatar/:id', setAvatar);
router.get('/allusers/:id', getAllUsers);
router.get('/logout/:id', logOut);

// --------- New avatar proxy route ---------
router.get('/avatar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://api.multiavatar.com/${id}`, {
      responseType: 'text', // raw SVG
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Error fetching avatar');
  }
});

module.exports = router;
