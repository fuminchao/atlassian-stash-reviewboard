import Vue from "vue";
import VueRouter from "vue-router";
import $ from "jquery";

import PullRequestListView from "pull-request-listview";
import PullRequestTileView from "pull-request-tileview";
import CommitCompactView from "commit-compactview";

import "css!../css/app.css";


Vue.filter('linkstash', function (tpl) {
  let args = Array.prototype.slice.call(arguments, 1);
  return 'https://stash.bbpd.io' + tpl.replace(/\{(\d+)\}/g,function(s,x){ return args[parseInt(x,10)]; });
});


Vue.use(VueRouter);

Vue.component( "pull-request-listview", PullRequestListView );
Vue.component( "pull-request-tileview", PullRequestTileView );
Vue.component( "commit-compactview", CommitCompactView );

let Application = Vue.extend({
  replace:false,
  template:`
    <router-view></router-view>
  `,
});

let router = new VueRouter();
router.map({
  '/inbox':{
    component: PullRequestListView,
  }
});

router.start(Application, '#application');
