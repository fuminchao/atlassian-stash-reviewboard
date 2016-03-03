import Vue from "vue";
import $ from "jquery";
import $pjax from "$pjax";

import "css!../css/commit-compactview.css";

export default Vue.extend({
  template:`
    <div class="commit-compactview" :class="[buildState]">
      <a href="{{ '/projects/{0}/repos/{1}/commits/{2}' | linkstash project repo commitId }}" target="_blank">{{commitId7}}</a><a class="sr-build" href="{{buildJob}}" target="_blank"></a>
    </div>
  `,
  data:()=>{
    return {
      commitId:undefined,
      buildState:'CHECKING',  // INPROGRESS SUCCESSFUL FAILED
      buildJob:'',
      timeoutId:0,
    }
  },
  props:['commitId','project','repo'],
  computed:{
    commitId7:function(){
      return /^(.{7}).*/.exec(this.commitId)[1];
    }
  },
  watch:{
    "commitId":function(v){
      this.buildState = 'CHECKING';
      this.fetchStat();
    }
  },
  methods:{
    fetchStat:function(){

      window.clearTimeout(this.timeoutId);

      this.commitId && $pjax(`/rest/build-status/latest/commits/stats/${this.commitId}`,{
        data:{
          includeUnique:true
        }
      })
      .then((data)=>{
        this.timeoutId = 0;

        let result = (data.results||[])[0];

        this.buildState = result ? result.state : 'NOT_RUNNING';
        this.buildJob = result ? result.url : '';

        if(this.buildState!=='SUCCESSFUL'){
          this.timeoutId = window.setTimeout(()=>{
            this.fetchStat();
          },{
            INPROGRESS: 5000,
            SUCCESSFUL: 600000,
            FAILED: 30000,
            NOT_RUNNING: 30000,
          }[this.buildState] );
        }
      });
    }
  },
  ready:function(){
    this.fetchStat();
  },
});
