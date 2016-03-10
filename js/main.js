Stamplay.init('hnewsv2');

$(document).ready(function () {

  /****************************/
  /*  LOGIN AND SIGNUP FORMS  */
  /****************************/
  $("#loginform").submit(function(e) {
    e.preventDefault();
    var credentials = {
      email : $("#loginform input[name='acct']").val(),
      password : $("#loginform input[name='pw']").val()
    }

    Stamplay.User.login(credentials)
      .then(function(res){
        window.location.href = "/index.html";
      }, function(err) {
        console.error("something went wrong!", err);
      });
  });

  $("#signupform").submit(function(e) {
    e.preventDefault();
    var registrationData = {
        email : $("#signupform input[name='acct']").val(),
        password: $("#signupform input[name='pw']").val()
    };

    Stamplay.User.signup(registrationData)
      .then(function(res){
        window.location.href = "/index.html";
      }, function(err){
        console.error("something went wrong!", err);
      })
  });

  $('#logout').on('click', function (e) {
    e.preventDefault();
    Stamplay.User.logout();
  })


  /****************************/
  /*      USER PWD RESET      */
  /****************************/
  $('#reset-pw').on('click', function (e) {
    e.preventDefault();
    Stamplay.User.resetPassword({ email : 'giuliano.iacobelli@gmail.com', password : '1111' })
      .then(function(){
        window.location.href = "/index.html";
      })
  })


  /****************************/
  /* INIT NAVBAR W/ USER INFO */
  /****************************/
  Stamplay.User.currentUser()
    .then(function(res) {
      var userId = res.user ? res.user._id : false;
      if(userId) {
        var email = res.user.email;
        var score = res.user.score ? res.user.score : 0;

        if (window.location.href.indexOf("contact") > -1) {
          $('#email').val(email);
          $('#email').attr('disabled', 'disabled')
        }
        $("#user-info").html("<span>"+ email +"</span> <span>("+ score + ")</span>");

        $('#login-btn').hide();
        /* Show submit button*/
        $('#submit-button').show();
        /* Show logout button*/
        $('#logout-btn').show();
        /* Retrieving the user's points */

      } else {
        /* User is not logged*/
      }
    }).catch(function (err) {
      console.log('err during user fetch ', err);
    });


  /****************************/
  /*      RENDER CONTENT      */
  /****************************/

  var page_param = (Utils.getParameterByName('page') === "") ?  1 : Utils.getParameterByName('page');

  var queryParam = {
    sort: '-actions.votes.total',
    per_page: 10,
    page: 1,
  };


  if (window.location.href.indexOf("item") > -1) {
    getPostDetail();
  } else if (window.location.href.indexOf("newest") > -1) {
    queryParam.sort = '-dt_create';
  } else if (window.location.href.indexOf("search") > -1) {
    var _id = Utils.getParameterByName("id");
    queryParam._id = _id;
  }

  getSortedPostList(queryParam);
  $('#newest').css('font-weight', 'none');

  $("#morenews").on("click", function(event) {
      event.preventDefault();
      queryParam.page += 1;
      getSortedPostList(queryParam);
  })


  /****************************/
  /*    SUBMIT NEW POST       */
  /****************************/
  $("#sendnews").submit(function (event) {
    event.preventDefault();

    var newPost = {
      title : $("input[name='title']").val(),
      url : $("input[name='url']").val(),
      description : $("#description").val()
    }

    Stamplay.Object("post").save(newPost)
      .then(function(res) {
        window.location.href = "/index.html";
      }, function(err) {
        console.error("something went wrong!", err);
      });
  });



  /****************************/
  /* UPVOTE AND COMMENT POSTS */
  /****************************/
  $('body').on('click', 'a.voteelem', function (e) {
    e.preventDefault();
    var postid = $(this).data('postid');

    Stamplay.Object("post").upVote(postid)
      .then(function () {
        var score = $("#score_" + postid).data('score');
        score++;
        $("#score_" + postid).html(score + ' points');
      }, function(err) {
        console.error("something went wrong!", err);
      });
  });


  $('body').on('submit', '#submitcomment', function (e) {
    e.preventDefault();
    var postid = $(this).data('postid');
    var comment = $("textarea[name='text']").val();

    Stamplay.Object("post").comment(postid, comment)
      .then(function(res) {
        document.location.reload(true);
      }, function(err) {
        console.error("something went wrong!", err);
      });
  });


  /****************************/
  /*       CONTACT FORM       */
  /****************************/
  $("#contactform").submit(function (event) {
    event.preventDefault();
    var contact = {
      email : $("#contactform input[name='email']").val(),
      message : $("#contactform textarea[name='message']").val()
    }

    Stamplay.Object("contact").save()
      .then(function(res) {
        window.location.href = "/index.html";
      }, function(err) {
        console.error("something went wrong!", err);
      });

  });



  /****************************/
  /* ALGOLIA TYPEAHEAD SEARCH */
  /****************************/
  var algolia = algoliasearch('7TMV8F22UN','b5e5aa05c764aa1718bc96b793078703' );
  var index = algolia.initIndex('hackernewsposts');
  $('#post-search').typeahead({hint: false}, {
    source: index.ttAdapter({hitsPerPage: 3}),
    displayKey: 'title',
    templates: {
      suggestion: function(hit) {
        // render the hit
        return '<div class="hit" id="'+ hit.objectID +'"">' +
          '<div class="name">' +
            hit._highlightResult.title.value + ' ' +
            '(' + hit._highlightResult.url.value + ')' +
          '</div>' +
        '</div>';
      }
    }
  }).on('typeahead:selected', function (e, obj) {
    $('#post-search').data('objectID', obj.objectID);
    console.log($('#post-search').data('objectID'))
  });

  $("#search-form").submit(function (event) {
    event.preventDefault();
    window.location.href = "/search.html?id="+$('#post-search').data('objectID');
  })

});



/****************************/
/*   GET SINGLE POST INFO   */
/****************************/
function getPostDetail() {
  var postId = Utils.getParameterByName("id");

  Stamplay.Object("post").get({ _id : postId})
  .then(function(res) {
    var post = res.data[0];
    var viewData = {
      id : post._id,
      url : post.url,
      shortUrl : Utils.getHostname(post.url),
      title : post.title,
      dt_create : Utils.formatDate(post.dt_create),
      votesLength : post.actions.votes.users_upvote.length
    }
    Utils.renderTemplate('post-detail', viewData, '#postcontent');

    post.actions.comments.forEach(function (comment) {
      var viewData = {
        displayName: comment.displayName,
        dt_create: Utils.formatDate(comment.dt_create),
        text: comment.text
      }
      Utils.renderTemplate('post-comment', viewData, '#postcomments');
    })

  }).catch(function (err) {
    console.log('error', err);
  })
}


/****************************/
/*     RENDER POST LIST     */
/****************************/
function getSortedPostList(queryParam) {

  Stamplay.Object("post").get(queryParam)
  .then(function(res) {
    var viewDataArray = [];
    var post_count = (queryParam.page - 1) * queryParam.per_page;
    $('#newstable').html('');
    res.data.forEach(function (post, count) {
      var viewData = {
        id: post._id,
        count : post_count += 1,
        url: post.url,
        shortUrl: Utils.getHostname(post.url),
        title: post.title,
        dt_create: Utils.formatDate(post.dt_create),
        commentLength: post.actions.comments.length,
        votesLength: post.actions.votes.users_upvote.length
      }
      viewDataArray.push(viewData)
    });
    Utils.renderTemplate('list-elem', viewDataArray, '#newstable');

  })
}
