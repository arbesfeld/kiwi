
module.exports = function (app) {

  app.get('/kiwi', function (req, res) {
    console.log("Kiwi");
    res.render('kiwi');
  });

}