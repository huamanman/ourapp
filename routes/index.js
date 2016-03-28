var express = require('express');
var router = express.Router();
var usr = require('dao/dbConnect');
var session = require('express-session');

var result=[];
var login_username = null;
var login_password = null;
var login_level = 0;
var login_rate = 0;
var login_experience = 0;
var score = 0;
var correct = null;
var client=usr.connect();
var experience = 0;

 
 /* GET home page. */ 
 router.route('/')
     .get(function(req, res) {
         if(req.session.islogin){
             res.locals.islogin=req.session.islogin;
         }
 
         if(req.cookies.islogin){
             req.session.islogin=req.cookies.islogin;
         }
         var value = null;
         res.render('login',{results:value});
     })
     .post(function(req, res) {
         login_username = null;
         login_password = null;
         login_level = 0;
         login_rate = 0;
         login_experience = 0;
         if(req.body.subject==="signIn"){
             client=usr.connect();
             
             usr.selectFun(client,req.body.username, function (result) {
                    if(result[0]===undefined){
                    value = 0;

                    res.redirect('/');
                    }else{
                          if(result[0].password===req.body.password){
                          req.session.islogin=req.body.username;
                          res.locals.islogin=req.session.islogin;
                          res.cookie('islogin',res.locals.islogin,{maxAge:60000});
                          login_username=result[0].username;
                          login_password = result[0].password;
                          login_level = result[0].current_level;
                          login_rate = result[0].current_rate;
                          login_experience = result[0].experience;
                          value = null;
                          res.redirect('/info');
                          }else
                              {      
                               value = 1;
                               res.redirect('/');
                               }
                          }
            });
         }
         else{
                     client = usr.connect();
                     result=null;
                     usr.selectFun(client,req.body.username, function (result) {
                         if(result[0]===undefined){
                              usr.insertFun(client,req.body.username ,req.body.password,login_level,login_rate,login_experience, function (err) {
                              if(err) throw err;                         
                              login_username= req.body.username;
                              login_password = req.body.password;
                              value = null;
                              res.redirect('/info');
                              });
                         }else{  
                                 value = 2;
                                 res.redirect('/');
                             }
                            
                     });


         }
         
     });

router.get('/info',function(req, res){
  if(req.session.islogin){
         res.locals.islogin=req.session.islogin;
     }
     if(req.cookies.islogin){
         req.session.islogin=req.cookies.islogin;
     }
     res.render('info', {user: login_username, level: login_level, correctness: login_rate});
});

router.get('/question1', function(req, res) {
    var genre = req.query.genre
    var hardness = req.query.hardness
    req.session.genre = genre
    
    req.session.hardness = hardness
    console.log(req.session.genre)
    if(hardness == 1){
      req.session.lowvotes = 1000;
      req.session.highvotes = 8000;
    }
    else if(hardness == 2){
      req.session.lowvotes = 500;
      req.session.highvotes = 1000;
    }
    else if(hardness == 3){
      req.session.lowvotes = 0;
      req.session.highvotes = 500;
    }
    console.log(req.session.lowvotes);
    console.log(req.session.highvotes);
    client = usr.connect();
    client.query('SELECT M.NAME, M.ID FROM dbquiz.MOVIE M INNER JOIN dbquiz.MOVIE_GENRE MG ON M.ID = MG.MOVIE_ID WHERE MG.GENRE = "'+genre+'" AND M.VOTES>= "'+req.session.lowvotes+'" AND M.VOTES < "'+req.session.highvotes+'" ORDER BY RAND() LIMIT 1', function(err,movie){
             console.log(movie[0].NAME)
             if(err) throw err;
    client.query('SELECT P.NAME FROM dbquiz.PERSON P INNER JOIN dbquiz.movie_director md ON P.PERSON_ID = md.directorid WHERE md.movieid ="'+ movie[0].ID+'"', function(err,director){
             if(director[0]==undefined){
                res.redirect('/question1');
             }
             else{
                 console.log(director[0].NAME)
                 if(err) throw err;
                 client.query('SELECT P.NAME FROM dbquiz.PERSON P INNER JOIN dbquiz.movie_director md ON P.PERSON_ID = md.directorid WHERE P.NAME <> "'+director[0].NAME+'" ORDER BY RAND() LIMIT 4',function(err, otherdirector){
                        console.log(otherdirector)
                        if(err) throw err;
                        result[0] = movie[0].NAME;
                        result[1] = otherdirector[0].NAME;
                        result[2] = otherdirector[1].NAME;
                        result[3] = otherdirector[2].NAME;
                        result[4] = otherdirector[3].NAME;
                        var a = Math.floor((Math.random()*4)+1);
                        result[a] = director[0].NAME;
                        correct = a;
                        res.render('question1',{result:result});


                 });
             }
                  });
    
   
   });

});

router.get('/question2',function(req,res){
  var last_result = req.query.Answer;
  console.log(last_result);
  console.log(correct);
  if(last_result == correct){
     score=score+ 1;
  }
  usr.movieSelect(client,req.session.genre,req.session.lowvotes,req.session.highvotes,function(movie){
          console.log(movie[0].NAME);
         // var movieid = movie[0].ID;
          usr.directorSelect(client,movie[0].ID,function(director){
                 if(director[0]==undefined){
                      if(last_result == correct){
                         score=score - 1;
                      }
                      res.redirect('/question2');
                 }
                 else{
                     console.log(director[0].NAME)
                     client =  usr.connect();
                     client.query('SELECT M.NAME FROM dbquiz.MOVIE M INNER JOIN dbquiz.movie_director MD ON MD.movieid = M.ID WHERE MD.directorid <> "'+director[0].PERSON_ID+'" ORDER BY RAND() LIMIT 4',function(err,othermovie){
                          if(err) throw err;
                          
                          
                          result[0] = director[0].NAME;
                          result[1] = othermovie[0].NAME;
                          result[2] = othermovie[1].NAME;
                          result[3] = othermovie[2].NAME;
                          result[4] = othermovie[3].NAME;
                        
                          var b = Math.floor((Math.random()*4)+1);
                          correct = b;
                          result[b] = movie[0].NAME;
                          res.render('question2',{result:result});
                  });
              }
                 
                     

                 });
          });
                    

});

router.get('/question3', function(req,res){
    last_result = req.query.Answer;
    console.log(last_result);
    console.log(correct);
    if(last_result == correct){
        score=score+ 1;
    }
    usr.movieSelect(client,req.session.genre,req.session.lowvotes,req.session.highvotes,function(movie){
        console.log(movie[0].NAME)
         usr.orderSelect(client,movie[0].ID,function(ord){
            if(ord[0] == undefined){
              if(last_result == correct){
                         score=score - 1;
              }
              res.redirect('/question3');
            }
            else{
                  console.log(ord);
                  
                  usr.actorSelect(client,ord[0].PERSON_ID,function(actor){
                    console.log(actor)
                    client.query('SELECT NAME FROM dbquiz.PERSON WHERE PERSON_ID NOT IN (SELECT PERSON_ID FROM dbquiz.CAST WHERE MOVIE_ID = "'+movie[0].ID+'") ORDER BY RAND() LIMIT 4', function(err, otheractor){
                            if(err) throw err;
                            
                            
                            result[0] = movie[0].NAME;
                            result[1] = otheractor[0].NAME;
                            result[2] = otheractor[1].NAME;
                            result[3] = otheractor[2].NAME;
                            result[4] = otheractor[3].NAME;
                          
                            var c = Math.floor((Math.random()*4)+1);
                            correct = c;
                            result[c] = actor[0].NAME;
                            res.render('question3',{result:result});
                            
                  });

                  });
            }
            
            
         });
    });

});

router.get('/question5', function(req,res){
     
    last_result = req.query.Answer;
    console.log(last_result);
    console.log(correct);
    if(last_result == correct){
        score=score+ 1;
    }
     usr.movieSelect(client,req.session.genre,req.session.lowvotes,req.session.highvotes,function(movie){
       console.log(movie[0].NAME)
        client.query('SELECT NAME FROM dbquiz.MOVIE WHERE NAME <>"'+movie[0].NAME+'" ORDER BY RAND() LIMIT 4', function(err,othermovie){
              console.log(othermovie)
              if(err) throw err;
              result[0] = movie[0].OVERVIEW;
              result[1] = othermovie[0].NAME;
              result[2] = othermovie[1].NAME;
              result[3] = othermovie[2].NAME;
              result[4] = othermovie[3].NAME;
              var c = Math.floor((Math.random()*4)+1);
              correct = c;
              result[c] = movie[0].NAME;
              res.render('question5',{result:result});


        });
     });

});

router.get('/question6',function(req,res){
    last_result = req.query.Answer;
    console.log(last_result);
    console.log(correct);
    if(last_result == correct){
        score=score+ 1;
    }
    usr.movieSelect(client,req.session.genre,req.session.lowvotes,req.session.highvotes,function(movie){
      console.log(movie[0].NAME)
      usr.studioSelect(client,movie[0].ID,function(studio){
          console.log(studio)
          client.query('SELECT studioname from dbquiz.studio where id NOT IN (SELECT STUDIOID FROM dbquiz.MOVIE_STUDIO WHERE MOVIEID = "'+movie[0].ID+'") ORDER BY RAND() LIMIT 4', function(err, otherstudio){
              console.log(otherstudio)
              if(err) throw err;
              result[0] = movie[0].NAME;
              result[1] = otherstudio[0].studioname;
              result[2] = otherstudio[1].studioname;
              result[3] = otherstudio[2].studioname;
              result[4] = otherstudio[3].studioname;
              var c = Math.floor((Math.random()*4)+1);
              correct = c;
              if (studio[0] == undefined) {
                result[c] = "Unknown";
              }
              else{
                 result[c] = studio[0].studioname;
              }
             
              res.render('question6',{result:result});


          });
      });
    });

});

router.get('/question7',function(req,res){
    last_result = req.query.Answer;
    console.log(last_result);
    console.log(correct);
    if(last_result == correct){
        score=score+ 1;
    }
     usr.movieSelect(client,req.session.genre,req.session.lowvotes,req.session.highvotes,function(movie){
          console.log(movie)
          usr.orderSelect(client,movie[0].ID,function(ord){
                   if(ord[0]==undefined){
                      if(last_result == correct){
                         score=score - 1;
                      }
                      res.redirect('/question7');
                   }
                   else{
                         console.log(ord)
                         usr.actorSelect(client,ord[0].PERSON_ID,function(actor){
                                if(actor[0] == undefined){
                                    if(last_result == correct){
                                        score=score - 1;
                                    }
                                  res.redirect('/question7');
                                }
                                else{

                                    console.log(actor)
                                    client.query('SELECT M.NAME FROM dbquiz.MOVIE M INNER JOIN dbquiz.CAST C ON C.MOVIE_ID = M.ID WHERE C.PERSON_ID = "'+actor[0].PERSON_ID+'" ORDER BY RAND() LIMIT 4',function(err, actor_movie){
                                                console.log(actor_movie);
                                                client.query('SELECT M.NAME FROM dbquiz.MOVIE M INNER JOIN dbquiz.MOVIE_GENRE MG ON MG.MOVIE_ID = M.ID WHERE MG.GENRE = "'+req.session.genre+'" AND M.VOTES >= "'+req.session.lowvotes+'" AND M.VOTES < "'+req.session.highvotes+'" AND M.ID NOT IN (SELECT MOVIE_ID FROM dbquiz.CAST C WHERE C.PERSON_ID = "'+actor[0].PERSION_ID+'") ORDER BY RAND() LIMIT 1', function(err, othermovie){
                                                          if(err) throw err;
                                                          if(actor_movie[0] == undefined || actor_movie[1] == undefined || actor_movie[2] == undefined || actor_movie[3] == undefined){
                                                            if(last_result == correct){
                                                                 score=score - 1;
                                                            }
                                                            res.redirect('/question7');
                                                          }
                                                          else{
                                                              console.log(othermovie)
                                                              result[0] = actor[0].NAME;
                                                              result[1] = actor_movie[0].NAME;
                                                              result[2] = actor_movie[1].NAME;
                                                              result[3] = actor_movie[2].NAME;
                                                              result[4] = actor_movie[3].NAME;
                                                              var c = Math.floor((Math.random()*4)+1);
                                                              correct = c;
                                                              result[c] = othermovie[0].NAME;
                                                              res.render('question7',{result:result});
                                                          }
                                                          


                                                 });
                                    });

                                }
                               
                  
                        });
                   }
                   
          });
         
     });

}); 

router.get('/question8',function(req,res){
    last_result = req.query.Answer;
    console.log(last_result);
    console.log(correct);
    if(last_result == correct){
        score=score+ 1;
    }
    usr.ratingSelect(client,req.session.genre,req.session.lowvotes,req.session.highvotes,7,function(movie){
      console.log(movie)  
      client.query('SELECT M.NAME FROM dbquiz.MOVIE M INNER JOIN dbquiz.MOVIE_GENRE MG ON M.ID = MG.MOVIE_ID WHERE MG.GENRE = "'+req.session.genre+'" AND M.VOTES>= "'+req.session.lowvotes+'" AND M.VOTES < "'+req.session.highvotes+'" AND M.RATING >= 7 ORDER BY RAND() LIMIT 4',function(err,othermovie){
                if (err) throw err;
                console.log(othermovie)
                result[1] = othermovie[0].NAME;
                result[2] = othermovie[1].NAME;
                result[3] = othermovie[2].NAME;
                result[4] = othermovie[3].NAME;
                var c = Math.floor((Math.random()*4)+1);
                correct = c;
                result[c] = movie[0].NAME;
                res.render('question8',{result:result});

      });
     


});
});

router.get('/question9',function(req,res){
    last_result = req.query.Answer;
    console.log(last_result);
    console.log(correct);
    if(last_result == correct){
        score=score+ 1;
    }
    usr.movieSelect(client,req.session.genre,req.session.lowvotes,req.session.highvotes,function(movie){
        console.log(movie);
        client.query('SELECT P.NAME FROM dbquiz.PERSON P INNER JOIN dbquiz.CAST C ON P.PERSON_ID = C.PERSON_ID WHERE C.MOVIE_ID ="'+movie[0].ID+'"', function(err,actor){

          if(err) throw err;
          if(actor[0]==undefined || actor[1] == undefined || actor[2] == undefined || actor[3] == undefined){
            if(last_result == correct){
                         score=score - 1;
                      }
            res.redirect('/question9');
          }
          else{
               console.log(actor)
               client.query('SELECT P.NAME FROM dbquiz.PERSON P WHERE P.NAME NOT IN (SELECT P.NAME FROM dbquiz.PERSON P INNER JOIN dbquiz.CAST C ON P.PERSON_ID = C.PERSON_ID WHERE C.MOVIE_ID ="'+movie[0].ID+'") ORDER BY RAND() LIMIT 1',function(err,otheractor){
                      console.log(otheractor);
                      result[0] = movie[0].NAME;
                      result[1] = actor[0].NAME;
                      result[2] = actor[1].NAME;
                      result[3] = actor[2].NAME;
                      result[4] = actor[3].NAME;
                      var c = Math.floor((Math.random()*4)+1);
                      correct = c;
                      result[c] = otheractor[0].NAME;
                      res.render('question9',{result:result});
                      
               });
          }
           
          
          
        });
    });
      

});

router.get('/question10',function(req,res){
    last_result = req.query.Answer;
    console.log(last_result);
    console.log(correct);
    if(last_result == correct){
        score=score+ 1;
    }
    usr.genreSelect(client,req.session.genre,req.session.lowvotes,req.session.highvotes,function(movie){
      console.log(movie);
      client.query('SELECT M.NAME FROM dbquiz.MOVIE M WHERE M.ID NOT IN (SELECT MOVIE_ID FROM dbquiz.MOVIE_GENRE WHERE GENRE = "'+req.session.genre+'") ORDER BY RAND() LIMIT 1', function(err,othermovie){
                if(err) throw err;
                result[1] = movie[0].NAME;
                result[2] = movie[1].NAME;
                result[3] = movie[2].NAME;
                result[4] = movie[3].NAME;
                var c = Math.floor((Math.random()*4)+1);
                correct = c;
                result[c] = othermovie[0].NAME;
                res.render('question10',{result:result});


      });

     });
    

});
 
 router.get('/question4', function(req,res){
    last_result = req.query.Answer;
    console.log(last_result);
    console.log(correct);
    if(last_result == correct){
        score=score+ 1;
    }
    client.query('SELECT M.NAME FROM dbquiz.MOVIE M INNER JOIN dbquiz.MOVIE_GENRE MG ON M.ID = MG.MOVIE_ID WHERE MG.GENRE = "'+req.session.genre+'" AND M.VOTES>= "'+req.session.lowvotes+'" AND M.VOTES < "'+req.session.highvotes+'" AND SUBSTRING(M.RELEASEDATE,-2) < "15" ORDER BY RAND() LIMIT 1', function(err,movie){
      if(err) throw err;
      console.log(movie[0]);
        client.query('SELECT M.NAME FROM dbquiz.MOVIE M INNER JOIN dbquiz.MOVIE_GENRE MG ON M.ID = MG.MOVIE_ID WHERE MG.GENRE = "'+req.session.genre+'" AND  SUBSTRING(M.RELEASEDATE,-2) >= "15" ORDER BY RAND() LIMIT 4', function(err,othermovie){
                if(err) throw err;
                console.log(othermovie)
                result[1] = othermovie[0].NAME;
                result[2] = othermovie[1].NAME;
                result[3] = othermovie[2].NAME;
                result[4] = othermovie[3].NAME;
                var c = Math.floor((Math.random()*4)+1);
                correct = c;
                if(movie[0]==undefined){
                  result[c] = "NO MOVIE";
                }
                else{
                  result[c] = movie[0].NAME;
                }
                
                res.render('question4',{result:result});



      });
     });   

 });

router.get('/endpage', function(req, res) {
    last_result = req.query.Answer;
    console.log(last_result);
    console.log(correct);
    if(last_result == correct){
     score=score+ 1;
    }
    
    if(score > 7){
      if(req.session.hardness == 1){
            experience = 10;
            login_experience = login_experience + 10;
          }
          else if(req.session.hardness == 2){
            experience = 20;
            login_experience = login_experience + 20;
          }
          else if(req.session.hardness == 3){
            experience = 30;
            login_experience = login_experience + 30;
      }
      
      login_level = req.session.hardness;
    }

    
    login_rate = score;
    usr.deleteFun(client,login_username,function(err,result){
      usr.insertFun(client,login_username,login_password, login_level,login_rate,login_experience,function(err,rows){
              res.render('endpage',{user:login_username, correctNumber:score, experience: experience});
              score = 0;
      });
        
    });


   

    
    
    
});
   
 


module.exports = router;
