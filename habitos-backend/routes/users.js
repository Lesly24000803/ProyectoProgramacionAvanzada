var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/register', async (req, res, next)=>{
  try {
    const {username, password} = req.body;

    const salt =  await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({username, password: hashedPassword});
    await newUser.save();

    res.status(201).json({ message: "El usuario se ha registrado correctamente" });
  }catch(err) {
    res.status(500).json({err: "Error en el registro", "description":err.toString()});
  }
});

router.post('/login', async function(req, res, next) {
  try {
    const { username, password } = req.body;

    // Buscamos al usuario en la base de datos
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

    // Comparar la contraseña ingresada con el hash almacenado
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Contraseña incorrecta" });

    // Generar un JWT para la sesión
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('habitToken', token, {
      httpOnly: false, // Previene acceso desde JavaScript (XSS)
      secure: process.env.NODE_ENV === 'production', // Solo en HTTPS en producción
      sameSite: 'Strict', // Evita envío en otros sitios
      maxAge: 7 * (24) * 60 * 60 * 1000 // 7 días de duración
    });

    res.json({ message: "Inicio de sesión exitoso", token });
  } catch (error) {
    res.status(500).json({ error: "Error en el login", "description": error.toString() });
  }
});

module.exports = router;
