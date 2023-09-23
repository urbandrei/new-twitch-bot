import './Users.css';
import { useState, useEffect } from "react";

const socket = new WebSocket('ws://localhost:3001');
var data = [];

socket.onmessage = (event) => {
	const receivedMessage = JSON.parse(event.data);
	for( let i of data ) {
		if(i.user_id == receivedMessage.user_id) {
			i.message = receivedMessage.mess;
			i.message_timer = 1000;
		}
	}
	fetch('http://localhost:5000/users')
	.then((response) => response.json())
	.then((info) => updateUsers(info))
	.catch((error) => console.error('Error fetching data:', error));
};

function compareByID(a,b) {
        if ( a.user_id < b.user_id ){
                return -1;
        }
        if ( a.user_id > b.user_id ){
                return 1;
        }
        return 0;
}

function updateUsers(moreinfo) {
	data.sort(compareByID);
	const info = moreinfo.data;
        info.sort(compareByID);
        var i = 0;
        var j = 0;
        while (i < data.length || j < info.length) {
		if (j >= info.length) {
                        if(data[i].position<-400) {
                                data.splice(i, 1);
                        }
                        else {
                                data[i].state = "leaving";
                                i++;
                        }
                }
                else if (i >= data.length) {
                        data.unshift({
                                name:info[j].user_name,
                                user_id:info[j].user_id,
                                position:-400 - Math.floor(Math.random()*400),
                                state:"right",
                                frame:Math.floor(Math.random()*12),
				message:"",
				message_timer:0,
				color:info[j].color,
                        });
                        i++;
                        j++;
                }
                else if(data[i].user_id == info[j].user_id) {
                        if(data[i].state == "leaving") {
                                data[i].state = "right";
                        }
			data[i].color = info[j].color;
                        i++;
                        j++;
                }
		else if (data[i].user_id < info[j].user_id){
                        if(data[i].position<-400) {
                                data.splice(i, 1);
                        }
                        else {
                                data[i].state = "leaving";
                                i++;
                        }
                }
                else {
                        data.unshift({
                                name:info[j].user_name,
                                user_id:info[j].user_id,
                                position:-400 - Math.floor(Math.random()*400),
                                state:"right",
                                frame:Math.floor(Math.random()*12),
				message:"",
				message_timer:0,
				color:info[j].color,
                        });
                        i++;
                        j++;
                }
        }
}

function Character(props) {
	let vert = (props.state=="left"||props.state=="leaving")*(-200)+(props.color=="orange")*(-400)+(props.color=="yellow")*(-800)+(props.color=="green")*(-1200)+(props.color=="blue")*(-1600)+(props.color=="purple")*(-2000);
        var frame = {
                background: "url('spritesheet.png') "+(200*(props.frame%12))+"px "+vert+"px",
        };
        var pos = {
                left: props.pos+"px",
        };
        return <div className="character" style={pos}>
		<div class="message">{props.message}</div>
		<div class="character-text">{props.name}</div>
                <img src="blank.png" className="character-image" style={frame}></img>
                </div>;
}

function updateState() {
        for(let i = 0; i < data.length; i++){
                if(data[i].message_timer <=0) {
			data[i].message = '';
		}
		else {
			data[i].message_timer--;
		}
		if(data[i].state == "leaving") {/*do nothing*/}
                else if(data[i].position < 0){
                        data[i].state = "right";
                }
                else if(data[i].position>2560-400) {
                        data[i].state = "left";
                }
                else {
                        var random = Math.random();
                        if(random < .002) {
                                data[i].state = "left";
                        }
			else if(random < .004) {
                                data[i].state = "right";
                        }
                        else if(random < .008) {
                                data[i].state = "wait";
                        }
                }
                if(data[i].state == "wait") {
                        data[i].frame = 2;
                }
                else if(data[i].state == "right") {
                        data[i].frame = data[i].frame + 1;
                        data[i].position = data[i].position + 4;
                }
                else if(data[i].state == "left" || data[i].state == "leaving") {
                        data[i].frame = data[i].frame - 1;
                        data[i].position = data[i].position - 4;
                }
        }
}

function Users() {
        const [count, setCount] = useState(0);

        useEffect(() => {
                setTimeout(() => {
                        updateState();
                        setCount((count) => count+1);
                        if(count%500 == 0) {
                                fetch('http://localhost:5000/users')
                                        .then((response) => response.json())
                                        .then((info) => updateUsers(info))
                                        .catch((error) => console.error('Error fetching data:', error));
                        }
                }, 30);
        });
        return (
                <main>
                {
                        data.map((item, index) => (<Character key={index} id={item.user_id} name={item.name} frame={item.frame} pos={item.position} state={item.state} message={item.message} color={item.color}/>))
		}
                </main>
        )
}

export default Users;
