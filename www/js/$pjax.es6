
import $ from 'jquery';

export default function(){
  let args = arguments;
  return new Promise((resolve, reject)=>{

    $.ajax.apply($, arguments).then(
      (data)=>{
        resolve(data)
      },
      (error)=>{
        reject(error);
      }
    );

  });
};
