const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
require('dotenv').config();

const Schema = mongoose.Schema;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// middleware para recibir lo del body
app.use(bodyParser.urlencoded({ extended: false }))

// Esquema del usuario 
const userSchema = new Schema({
  username: { type: String }
});

// Esquema del ejercicio 
const exerciceSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Referencia al usuario
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now() }
});

// Asignamos el schema a la variable User
const User = mongoose.model("User", userSchema);
// Asignamos el schema a la variable Exercice 
const Exercice = mongoose.model("Exercice", exerciceSchema);


// Get a /api/users debe devolver mis usuarios de la base de datos
app.get('/api/users', async (req, res) => {
  const users = await User.find();

  res.json(users);

});

// Post a /api/users debe crear un usuario 
app.post('/api/users', async (req, res) => {
  const { username } = req.body; //Me traigo el username 
  try {
    const newUser = new User({
      username: username
    });

    await newUser.save(); // Guardamos usuario
    res.json(newUser);

  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' })
  }
});
// Post a /api/users/:_id/exercises para guardar un ejercicio 
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const { _id } = req.params;
  try {
    // Verificar si existe user 
    const user = await User.findById({ _id });
    if (!user) {
      return res.status(400).json({ error: 'User not found' })
    }
    // Si no se proporciona una fecha, usar la actual
    const exerciseDate = date ? new Date(date) : new Date();

    // Crear exercice 
    const newExercice = new Exercice({
      user: _id,
      description: description,
      duration: duration,
      date: exerciseDate.toDateString()
    });

    await newExercice.save();

    // responder con el formato adecuado
    res.json({
      username: user.username,
      description: newExercice.description,
      duration: newExercice.duration,
      date: newExercice.date.toDateString(),
      _id: user._id
    });

  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// GET A /api/users/:_id/logs para obtener  un registro
/**
 * {
  username: "fcc_test",
  count: 1,
  _id: "5fb5853f734231456ccb3b05",
  log: [{
    description: "test",
    duration: 60,
    date: "Mon Jan 01 1990",
  }]
}

 */

app.get('/api/users/:_id/logs',async(req,res) => {
  const { _id } = req.params; // id del user que viene por params 
  try {
    const user = await User.findById({_id});
    if(!user) {
      return res.status(400).json({error:'User not found'});
    }
    const exercices = await Exercice.find({ user:user._id });


    res.json({
      username:user.username,
      count:parseInt(exercices.length),
      _id:user._id,
      log:exercices.map((ex) => ({
        description:ex.description,
        duration:ex.duration,
        date:ex.date.toDateString()
      }))
    })
    
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
