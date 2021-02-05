document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //send email once submit is pressed 
  document.querySelector("#compose-form")
    .addEventListener("submit", send_email)
  // load the inbox by default
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Get the correct mailbox from server 
  fetch(`/emails/${mailbox}`)
  .then(res => res.json())
  .then(data => {
    data.forEach(item => {
      const parent = document.createElement('div'); 

      build_email(item, parent, mailbox)

      parent.addEventListener('click', () => read_email(item['id']))
      document.getElementById('emails-view').appendChild(parent)

    })
  })
  .catch(err => console.log(err))
}

function build_email(item, parent, mailbox){
  if (mailbox==="inbox" && item["archived"]){
    return
  } else if (mailbox === "archive" && !item["archive"]){
    return; 
  }

  const div = document.createElement('div'); 

  const recipients = document.createElement('strong'); 
  if (mailbox === "sent"){
    recipients.innerHTML= item["recipient"].join(", ") + " "
  }
  else{
    recipients.innerHTML = item["sender"] + " "
  }

  div.appendChild(recipients)

  div.innerHTML += item["subject"]

  //Display timestamp 
  const d = document.createElement('div')
  d.innerHTML = item["timestamp"]
  d.style.display = "inline-block"
  d.style.float = "right"

  if (item['read']){
    parent.style.background = "grey"
    d.style.color = "black"
  } else {
    d.style.color = "red"
  }

  div.appendChild(d)

  div.style.padding = "10px"
  parent.appendChild(div)

  //Parent element Styling 
  parent.style.borderStyle = "dotted"
  parent.style.borderWidth = "2px"; 
  parent.style.margin = "20"
}
function send_email(e){
  e.preventDefault() 
 
  //GET fields 
  
  const recipients = document.querySelector('#compose-recipients').value
  const subject = document.getElementById('compose-subject').value
  const body = document.getElementById('compose-body').value 

  //Send to server 
  fetch('/emails', {
    method: 'POST', 
    body: JSON.stringify({
        recipients: recipients, 
        subject: subject, 
        body: body
    })
  })

  //Get the return data and parse 
  .then (res => res.json())
  .then(data => {
    load_mailbox('sent', data)
  })
  .catch(err => console.warn(err))
}

function read_email(id){
  document.getElementById('emails-view').style.display = "none";
  document.getElementById('email-view').style.display = "block"; 

  //Erase all previous emails 
  document.getElementById('email-view').innerHTML = ""

  //Email info  
  fetch(`/emails/${id}`)
    .then(res => res.json())
    .then (data => {
      console.log(data)
      build(data)
    })
    .catch(err => console.error(err))

    //Change read
    fetch(`/emails/${id}`,{
      method: "PUT", 
      body: JSON.stringify({
        read: true
      })
    })
  }

  function build(email){
    const from = document.createElement('div'), 
          to = document.createElement('div'), 
          subject = document.createElement('div'), 
          timestamp = document.createElement('div'), 
          reply = document.createElement('button'), 
          archive = document.createElement('button'), 
          body = document.createElement('div')
    from.innerHTML = `<strong>From: </strong> ${email["sender"]}`
    to.innerHTML = `<strong>To: </strong> ${email["recipients"].join(", ")}`; 
    subject.innerHTML = `<strong>Subject: </strong> ${email["subject"]}`
    timestamp.innerHTML = `<strong>At: </strong> ${email["timestamp"]}`
    body.innerHTML = email["body"]


    //Archive
    archive.innerHTML = '<button>Archive</button>';
    if (email["archived"]) {
      archive.innerHTML = "Remove from Archive"
    } else { 
      archive.innerHTML = "ARCHIVE"
    }
    archive.addEventListener("click", () => {
      archive_email(email); 
      load_mailbox("inbox")
    })
    //Reply 
    reply.innerHTML = '<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-reply-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9.079 11.9l4.568-3.281a.719.719 0 0 0 0-1.238L9.079 4.1A.716.716 0 0 0 8 4.719V6c-1.5 0-6 0-7 8 2.5-4.5 7-4 7-4v1.281c0 .56.606.898 1.079.62z"/></svg>  Reply';
    reply.classList = "btn btn-outline-primary m-2";
    reply.addEventListener("click", () => reply_email(email));

    document.getElementById("email-view").appendChild(from)
    document.getElementById("email-view").appendChild(to)
    document.getElementById("email-view").appendChild(subject)
    document.getElementById("email-view").appendChild(timestamp)
    document.getElementById("email-view").appendChild(archive)
    document.getElementById("email-view").appendChild(reply)
    document.getElementById("email-view").appendChild(document.createElement('hr'))
    document.getElementById("email-view").appendChild(body)

  }

  function archive_email(data){
    fetch(`/emails/${data["id"]}`, {
      method: "PUT", 
      body: JSON.stringify({
        archived: !data["archived"]
      })
    });
  }


function reply_email(email){
  document.getElementById("email-view").style.display = "none"; 
  document.getElementById("emails-view").style.display = "none";
  document.getElementById("compose-view").style.display = "block"; 


  //clear fields 
  document.getElementById("compose-recipients").value = email["sender"]; 
  document.getElementById("compose-subject").value = ((email["subject"].match(/^(Re:)\s/)) ? email["subject"] : `Re: ${email["subject"]}`);
  document.getElementById("compose-body").value = `From: ${email["sender"]} on ${email["timestamp"]} \n
  Wrote: \n 
  ${email["body"]}
  \n ------------------------------------------------------------------ \n
  `
}