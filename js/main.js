Stamplay.init('hackernewsapp');
var posts = new Stamplay.Cobject('post').Collection;
var user = new Stamplay.User().Model;


$(document).ready(function () {

  /****************************/
  /*  LOGIN AND SIGNUP FORMS  */
  /****************************/
  $("#loginform").submit(function (event) {
    event.preventDefault();
    var acct = $("#loginform input[name='acct']").val();
    var pw = $("#loginform input[name='pw']").val();

    user.login(acct, pw)
    .then(function(){
      window.location.href = "/index.html";
      console.log("logged in as" + user.get('displayName'));
    });

  });

  $("#signupform").submit(function (event) {
    event.preventDefault();
    var registrationData = {
        email : $("#signupform input[name='acct']").val(),
        password: $("#signupform input[name='pw']").val()
    };

    user.signup(registrationData).then(function(){
      window.location.href = "/index.html";
    }).then(function(){
      // Something went wrong
      console.log("something went wrong!");
    })
  });

  $('#logout').on('click', function (e) {
    e.preventDefault();
    user.logout();
  })


  /****************************/
  /*      USER PWD RESET      */
  /****************************/
  $('#reset-pw').on('click', function (e) {
    e.preventDefault();
    user.resetPassword('giuliano.iacobelli@gmail.com','1111').then(function(){
      window.location.href = "/index.html";
    })
  })


  /****************************/
  /* INIT NAVBAR W/ USER INFO */
  /****************************/
  user.currentUser()
    .then(function () {
      var userId = user.get('_id');
      if (userId) {

        if (window.location.href.indexOf("contact") > -1) {
          $('#email').val(user.get('email'));
          $('#email').attr('disabled', 'disabled')
        }

        $('#login-btn').hide();
        /* Show submit button*/
        $('#submit-button').show();
        /* Show logout button*/
        $('#logout-btn').show();
        /* Retrieving the user's points */

        $.ajax({
          method: 'GET',
          url: '/api/gm/v0/challenges/hnkarma/userchallenges/' + userId,
          params: {
            select: 'points'
          },
          success: function (response) {
            $('#user-info').html(user.get('email') + '  ' + response.points + ' | ');
          }
        });

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

  getSortedPostList(posts, queryParam);
  $('#newest').css('font-weight', 'none');

  $("#morenews").on("click", function(event) {
      event.preventDefault();
      queryParam.page += 1;
      getSortedPostList(posts, queryParam);
  })


  /****************************/
  /*    SUBMIT NEW POST       */
  /****************************/
  $("#sendnews").submit(function (event) {
    event.preventDefault();

    var title = $("input[name='title']").val();
    var url = $("input[name='url']").val();
    var description = $("#description").val();

    var newPost = new Stamplay.Cobject('post').Model;
    newPost.set('title', title);
    newPost.set('url', url);
    newPost.set('description', description);

    newPost.save().then(function () {
      window.location.href = "/index.html";
    });
  });



  /****************************/
  /* UPVOTE AND COMMENT POSTS */
  /****************************/
  $('body').on('click', 'a.voteelem', function (e) {
    e.preventDefault();
    var postid = $(this).data('postid');

    var post = new Stamplay.Cobject('post').Model;
    post.set('_id', postid);
    post.upVote().then(function () {
      var score = $("#score_" + postid).data('score');
      score++;
      $("#score_" + postid).html(score + ' points');
    });
  });


  $('body').on('submit', '#submitcomment', function (e) {
    e.preventDefault();
    var postid = $(this).data('postid');
    var post = new Stamplay.Cobject('post').Model;
    post.set('_id', postid);
    var comment = $("textarea[name='text']").val();
    post.comment(comment).then(function () {
      document.location.reload(true);
    });
  });


  /****************************/
  /*       CONTACT FORM       */
  /****************************/
  $("#contactform").submit(function (event) {
    event.preventDefault();
    var email = $("#contactform input[name='email']").val();
    var message = $("#contactform textarea[name='message']").val();

    var newContactMessage = new Stamplay.Cobject('contact').Model;
    newContactMessage.set('email', email);
    newContactMessage.set('message', message);
    newContactMessage.save().then(function () {
      window.location.href = "/index.html";
    });

  });



  /****************************/
  /* ALGOLIA TYPEAHEAD SEARCH */
  /****************************/
  var algolia = algoliasearch('KMI9X9PKNJ','69aebc4572e2e34f6724a1f44e1c601c' );
  var index = algolia.initIndex('posts');
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
  var post = new Stamplay.Cobject('post').Model;
  post.fetch(postId).then(function () {

    var viewData = {
      id : post.get('_id'),
      url : post.get('url'),
      shortUrl : Utils.getHostname(post.get('url')),
      title : post.get('title'),
      dt_create : Utils.formatDate(post.get('dt_create')),
      votesLength : post.get('actions').votes.users_upvote.length
    }
    Utils.renderTemplate('post-detail', viewData, '#postcontent');

    post.get('actions').comments.forEach(function (comment) {
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
function getSortedPostList(posts, queryParam) {

  posts.fetch(queryParam).then(function () {
    var viewDataArray = [];
    var post_count = (queryParam.page - 1) * queryParam.per_page;
    $('#newstable').html('');
    posts.instance.forEach(function (post, count) {

      var viewData = {
        id: post.get('_id'),
        count : post_count += 1,
        url: post.get('url'),
        shortUrl: Utils.getHostname(post.get('url')),
        title: post.get('title'),
        dt_create: Utils.formatDate(post.get('dt_create')),
        commentLength: post.get('actions').comments.length,
        votesLength: post.get('actions').votes.users_upvote.length
      }
      viewDataArray.push(viewData)

    });
    Utils.renderTemplate('list-elem', viewDataArray, '#newstable');

  })
}
