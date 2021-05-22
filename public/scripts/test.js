try{
    const title=document.getElementById("post_title");
}catch(e){
    //pass
}

if (document.activeElement.id="post_content"){
    title.type="text";
    alert("HEY !!!");
}else{
    alert("NIET");
}

function test(){
    alert("Hello !");
}


function sendVote(msg_id, comm_id, vote_type){
    /*
     * sends the upvote/downvote to the server
     *
     * msg_id represents the id of the post we want to upvote
     *
     * comm_id is the id of the comment from the vote, that we want to upvote
     *  if we want to upvote the original post, it should be made 0
     *
     * vote_type is either 1 or 0. 1 is upvote, 0 is downvote.
     *
     * sends a http request to the server to post the vote
     * 
     * no return code
     */
    const par=document.getElementById("votes"+msg_id+comm_id);
    
    let votes_amnt=par.innerHTML;
    if (vote_type){
        votes_amnt++;
        console.log(msg_id.toString()+comm_id.toString()+"U");
        const btn=document.getElementById(msg_id.toString()+comm_id.toString()+"U");
        btn.setAttribute("onclick", "javascript: sendVote("+msg_id+","+comm_id+",0)")
    }else{
        votes_amnt--;
        const btn=document.getElementById(msg_id.toString()+comm_id.toString()+"");
        btn.setAttribute("onclick", "javascript: sendVote("+msg_id+","+comm_id+",1)")
    }
    par.innerHTML=votes_amnt;
    
    var xhr = new XMLHttpRequest();
    var data = {
        msg_id: msg_id,
        comm_id: comm_id,
        vote_type: vote_type
    };
    xhr.open('POST','/vote');
    xhr.onload = function(data){
        console.log('loaded',this.responseText);
    };
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
}


