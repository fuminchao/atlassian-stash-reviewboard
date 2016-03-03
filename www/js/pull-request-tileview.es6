import Vue   from "vue";
import $     from "jquery";
import _     from "lodash";
import $pjax from "$pjax";

import "css!../css/pull-request-tileview.css";

export default Vue.extend({
  template:`
    <div class="pull-request-tileview" :class="[ pullRequest.state, pullRequest.watched?'watched':'' ]">

      <div class="sr-pr-brief">
        <a class="sr-keep-eye"></a>
        <a class="sr-pr-title" href="{{'/projects/{0}/repos/{1}/pull-requests/{2}' | linkstash project repository pullRequest.id}}" target="_blank">
          <span class="sr-id">{{pullRequest.id}}</span><span class="sr-title">{{pullRequest.title}}</span>
        </a>
        <a class="sr-pr-location" href="{{'/projects/{0}/repos/{1}/' | linkstash project repository}}" target="_blank">
          <span class="sr-project">{{project}}</span><span class="sr-repos">{{repository}}</span>
        </a>
      </div>

      <div class="sr-branches">
        <div><a href="{{'/projects/{0}/repos/{1}/browse?at={2}'|linkstash project repository pullRequest.fromRef.id}}" target="_blank">{{pullRequest.fromRef.displayId}}</a></div>
        <div><a href="{{'/projects/{0}/repos/{1}/browse?at={2}'|linkstash project repository pullRequest.toRef.id  }}" target="_blank">{{pullRequest.toRef.displayId}}</a></div>
      </div>

      <div class="sr-pr-details">
        <div>
          <div>build</div>
          <commit-compactview :commit-id="pullRequest.fromRef.latestCommit" :project="project" :repo="repository" />
        </div>
        <div>
          <div>reviews</div>
          <div>
            <span class="">T{{pullRequest.reviewers.length}}</span>
            <span class="">A{{reviewersApproved.length}}</span>
            <span class="">R{{reviewersRejected.length}}</span>
          </div>
        </div>
        <div>
          <div>issues</div>
          <div><a href="{{issues[0].url}}" target="_blank">{{issues[0].key}}</a></div>
        </div>
      </div>

    </div>
  `,
  props:['pullRequest'],
  data:function(){

    return {
      issues:[],
    };
  },
  watch:{
    "pullRequest.fromRef.latestCommit":function(v){
      this.$emit('change_committed', v);
    },
  },
  computed:{
    project:function(){
      return this.pullRequest.fromRef.repository.project.key;
    },
    repository:function(){
      return this.pullRequest.fromRef.repository.slug;
    },
    reviewersApproved:function(){
      return _.filter(this.pullRequest.reviewers, (r)=>{
        return r.approved;
      })
    },
    reviewersRejected:function(){
      return _.filter(this.pullRequest.reviewers, (r)=>{
        return r.rejected;
      })
    },
  },
  ready:function(){
    this.$emit('change_committed', this.pullRequest.fromRef.latestCommit);
  },
  events:{
    "change_committed":function(){

      $pjax(`/rest/jira/latest/projects/${this.project}/repos/${this.repository}/pull-requests/${this.pullRequest.id}/issues`)
      .then((data)=>{
        this.issues = data;
      });
    }
  },
});
