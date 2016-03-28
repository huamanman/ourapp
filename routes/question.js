var express = require('express');
var router = express.Router();
var usr = require('dao/dbConnect');
var result = [];


router.get('/question', function(req, res) {
    var genre = req.query.genre
    var hardness = req.query.hardness
    req.session.genre = genre
    req.session.hardness = hardness
    //console.log(req.session.genre)
    //console.log(req.session.hardness)
    client = usr.connect();

   client.query('SELECT M.NAME, M.ID FROM dbquiz.MOVIE M INNER JOIN dbquiz.MOVIE_GENRE MG 
	             ON M.ID = MG.MOVIE_ID 
	             WHERE MG.GENRE = req.session.genre
	             ORDER BY RAND()
	             LIMIT 1', function(err,movie){
            if(err) throw err;

   /* client.query('SELECT P.NAME FROM dbquiz.PERSON P INNER JOIN dbquiz.movie_director md 
                  ON P.PERSON_ID = md.directorid WHERE md.movieid = movie[0].ID ', function(err,director){
             if(err) throw err;
             client.query('SELECT P.NAME FROM dbquiz.PERSON P INNER JOIN dbquiz.movie_director md
             	           ON P.PERSON_ID = md.directorid ORDER BY RAND() LIMIT 4',function(err, otherdirector){
             	      if(err) throw err;*/
             	      result[0] = movie[0].NAME;
             	      //result[1] = otherdirector[0].NAME;
             	      //result[2] = otherdirector[1].NAME;
             	     // result[3] = otherdirector[2].NAME;
             	      //result[4] = otherdirector[3].NAME;
             	      /*var a = Math.floor((Math.random()*4)+1);
             	      result[a] = director[0].NAME;

             });
                  });*/
    
   res.render('question',{result:result})
   });
});


module.exports = router;