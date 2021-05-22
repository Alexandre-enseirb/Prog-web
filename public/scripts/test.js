const title=document.getElementById("post_title");
alert("IT WORKED")
console.log(document.activeElement)

if (document.activeElement.id="post_content"){
    title.type="text";
    alert("HEY !!!");
}else{
    alert("NIET");
}

function test(){
    alert("Hello !");
}

