
module.exports = function (app) {

  app.get('/kiwi', function (req, res) {
    res.render('kiwi');
  });

  app.get('/kiwi/help', function (req, res) {
    res.render('kiwi-help');
  });

}