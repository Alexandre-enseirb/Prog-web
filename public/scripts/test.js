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

function update_vote(vote_amnt,vote_type){
    /*
     * processes the update of the vote amount
     *
     * returns the new vote amount, as vote_amnt
     *
     * vote_type is as described in sendVote
     */

    if (vote_type){
        vote_amnt++;
    }else{
        vote_amnt--;
    }
    return vote_amnt;
}

function sendVote(msg_id, comm_id, vote_type,value){
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
     * value serves as an identifier of the button
     *  1 means it was originally an upvote button
     *  0 means it was originally a downvote button
     *
     *
     * sends a http request to the server to post the vote
     * 
     * no return code
     */
    
    let cancel=false; // will help the server decide if a vote was canceled

    // gets the display for the votes
    const par=document.getElementById("votes"+msg_id.toString()+comm_id.toString());
    
    // gets the current amount of votes
    let votes_amnt=par.innerHTML;
    votes_amnt=update_vote(votes_amnt,vote_type);
    const btnU=document.getElementById(msg_id.toString()+comm_id.toString()+"U");
    const btnD=document.getElementById(msg_id.toString()+comm_id.toString()+"D");

    /* quick note about the 2 next lines
     * img's innerHTML will store the current state of the img
     * U means it will upvote next time clicked
     * D means it will downvote next time clicked
     *
     * if the upvote image has innerHTML of "D", link was upvoted.
     * same for if downvote's innerHTML is "U"
     *
     */
    
    upvoted=(btnU.alt=="U" ? 0:1)
    downvoted=(btnD.alt=="D" ? 0:1)
    
    // updating our images
    if (value){
        // if we used a upvote button
        
        if (downvoted){
            console.log("downvoted")
            votes_amnt=update_vote(votes_amnt,vote_type); // we process twice, going from downvote to upvote
            btnD.setAttribute("onclick", "javascript: sendVote("+msg_id+","+comm_id+",0,0)")
            btnD.alt="D";
            btnD.src="images/downvote.png"
            console.log("Updated btnD");
        }
         
        
        const btn=document.getElementById(msg_id.toString()+comm_id.toString()+"U");
        // and we invert our button
        btnU.setAttribute("onclick", "javascript: sendVote("+msg_id+","+comm_id+","+(vote_type ? 0:1)+",1)")
        btnU.alt=(btnU.alt=="U" ? "D":"U");
        cancel=(btnU.alt=="U" ? true:false); // alt has been changed the line before, we check if we're back to upvoting
        btnU.src=(btnU.src=="http://localhost:3000/images/upvote.png" ? "images/upvote_2.png":"images/upvote.png");
        console.log("updated btnU");
    }else{
        // if we used a downvote button
        
        if (upvoted){
            votes_amnt=update_vote(votes_amnt,vote_type); // we process twice, going from upvote to downvote
            btnU.setAttribute("onclick", "javascript: sendVote("+msg_id+","+comm_id+",1,1)")
            btnU.alt="U";
            btnU.src="images/upvote.png"
        }
         

        const btn=document.getElementById(msg_id.toString()+comm_id.toString()+"U");
        // and we invert our button
        btnD.setAttribute("onclick", "javascript: sendVote("+msg_id+","+comm_id+","+(vote_type ? 0:1)+",0)")
        btnD.alt=(btnD.alt=="D" ? "U":"D");
        cancel=(btnD.alt=="D" ? true:false); // again, we check if we're back to downvoting
        btnD.src=(btnD.src=="http://localhost:3000/images/downvote_2.png" ? "images/downvote.png":"images/downvote_2.png")
    }
    
    // updating the graphics
    par.innerHTML=votes_amnt;
    
    // sending to the server
    var xhr = new XMLHttpRequest();
    var data = {
        msg_id: msg_id,
        comm_id: comm_id,
        vote_type: vote_type,
        cancel: cancel
    };
    xhr.open('POST','/vote');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
}


