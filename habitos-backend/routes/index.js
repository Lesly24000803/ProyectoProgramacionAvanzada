var express = require('express');
var router = express.Router();
const Habit = require('../models/Habit');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if(!token){
    return res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });
  }

  try{
    const tokenWithoutBearer = token.replace("Bearer ", "");
    const verified = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    req.user = verified;
    next();
  }catch(error){
    console.error(error);
    res.status(403).json({ error: "Token invalido o expirado" })
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/habits', authenticateToken, async(req, res,) => {
  try{
    const habits = await Habit.find();
    res.json(habits);
  }catch(err){
    res.status(500).json({ message: 'Error al obtener habitos' })
  }
});

router.post('/habits', async(req, res) => {
  try{
    const {title, description} = req.body;
    const habit = new Habit({title, description});
    await habit.save();
    res.json(habit);
  }catch(err){
    res.status(400).json({ message: 'Error al crear habito' });
  }
});

router.delete('/habits/:id', async (req,res) => {
  try{
    await Habit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Habito eliminado'});
  }catch(err){
    res.status(500).json({ message: 'Habito no encontrado' })
  }
});

router.patch('/habits/markasdone/:id', async (req , res) => {
  try{
    const habit = await Habit.findById(req.params.id);
    habit.lastDone = new Date();
    if(timeDifferenceInHours(habit.lastDone, habit.lastUpdate) < 24){
      habit.days = timeDifferenceInDays(habit.lastDone, habit.startedAt);
      habit.lastUpdate = new Date();
      habit.save();
      res.status(200).json({ message: 'Habito se ha completado' })
    }else{
      habit.days = 1;
      habit.lastUpdate = new Date();
      habit.save();
      res.status(200).json({ message: 'Habito se ha reiniciado' })
    }
  }catch (err){
    console.log(err);
    res.status(500).json({ message: 'Habito no encontrado' });
  }
});

const timeDifferenceInHours = (date1, date2) => {
  const differenceMs = Math.abs(date1 - date2);
  return differenceMs / (1000 * 60 * 60);
}

const timeDifferenceInDays = (date1, date2) => {
  const differenceMs = Math.abs(date1 - date2);
  return Math.floor(differenceMs / (1000 * 60 * 60 * 24));
}

module.exports = router;