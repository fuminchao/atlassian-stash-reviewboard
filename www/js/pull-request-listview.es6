import Vue from "vue";
import $ from "jquery";
import $pjax from "$pjax";

import "css!../css/pull-request-listview.css";

export default Vue.extend({
  template:`
    <div class="pull-request-listview">
      <pull-request-tileview v-for="pr in pullRequests | orderBy '_uid'" track-by="_uid" :pull-request="pr">
      </pull-request-tileview>
    </div>
  `,
  data:()=>{
    return {
      pullRequests:[]
    };
  },
  methods:{
    fetchData:function(){
      return $pjax('/rest/inbox/latest/pull-requests',{
        data:{
          "role":"author",
          "start":0,
          "limit":100,
          "avatarSize":64,
          "withAttributes":true,
          "state":"OPEN",
          "order":"oldest",
        }
      })
      .then((pullRequests)=>{

        return new Promise((resolve, reject)=>{

          Promise.all([$pjax('/rest/api/1.0/projects/LEARN/repos/b2-assessment/pull-requests/86'), $pjax('/rest/api/1.0/projects/LEARN/repos/b2-goal/pull-requests/14')])
          .then((data)=>{

            data.forEach((v)=>{ v.watched = true });

            Array.prototype.push.apply(pullRequests.values, data);
            resolve( pullRequests );
          });

        });
      })
      .then((data)=>{
        data.values.forEach((v)=>{
          v._uid = `w${v.watched?'A':'Z'}-${v.fromRef.repository.project.key}-${v.fromRef.repository.slug}-${v.id}`;
        });

        this.pullRequests = data.values;
        return data;
      })
      .then(()=>{
        window.setTimeout(()=>{
          this.fetchData();
        },5000);
      })
      .catch(()=>{
        window.setTimeout(()=>{
          this.fetchData();
        },5000);
      });
    }
  },
  route:{
    data:function(transition){
      this.fetchData().then(()=>{
        transition.next();
      });
    }
  },
});
