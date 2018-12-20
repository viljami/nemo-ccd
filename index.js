
const express = require('express');

const app = express();

app.use(express.static('dist'));
app.use(express.static('test'));

app.listen(8080, e => {
  if (e) return console.err(e);
  console.log('Servers tarted at: http://localhost:8080');
});
