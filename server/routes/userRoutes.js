
const { register, login, setAvatar, getAllUsers, logOut} = require('../controllers/userController') 

const router = require('express').Router()

router.post('/register', register)
router.post('/login', login)
router.post('/setavatar/:id', setAvatar)

router.get('/allusers/:id', getAllUsers)
router.get("/logout/:id", logOut)

// ✅ NEW avatar route
router.get("/avatar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://api.multiavatar.com/${id}`, {
      responseType: "text",
    });
    res.set("Content-Type", "image/svg+xml");
    res.send(response.data);
  } catch (err) {
    console.error("Avatar fetch error:", err.message);
    res.status(500).send("Error fetching avatar");
  }
});

module.exports = router