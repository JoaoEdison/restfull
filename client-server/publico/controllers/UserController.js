class UserController {

    constructor(formIdCreate, formIdUpdate, tableId){

        this.formEl = document.getElementById(formIdCreate);
        this.formElUpdate = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();
    }

    onEdit(){

        document.querySelector("#box-user-update #cancelE").addEventListener("click", e=>{

            this.showPanelCreate();
            
        });

        this.formElUpdate.addEventListener("submit", event => {

            event.preventDefault();

            let btn = this.formElUpdate.querySelector("[type=submit]");

            btn.disabled = true;

            let values = this.getValues(this.formElUpdate);
            
            let tr = this.tableEl.rows[this.formElUpdate.dataset.trIndex]

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values);        

            this.getPhoto(this.formElUpdate).then(
                (content) => {     

                    if(!values.photo) {                         
                        result._photo = userOld._photo;                   
                    } else {
                        result._photo = content;
                    }

                    let user = new User();

                    user.loadFromJSON(result);

                    user.save().then(user=>{

                        this.getTr(user, tr);                  
                    
                        this.updateCount();   
    
                        this.formElUpdate.reset();
    
                        btn.disabled = false;
    
                        this.showPanelCreate();

                    });                   

                }, 
                (e) => {
                    console.error(e);
                }
            );

        });

    }

    onSubmit(){        

        this.formEl.addEventListener("submit", event => {

            event.preventDefault();   

            let btn = this.formEl.querySelector("[type=submit]");

            btn.disabled = true;
            
            let values = this.getValues(this.formEl);  

            if (!values) {
                btn.disabled = false;//////////////
                return false;
            }
            
            this.getPhoto(this.formEl).then(
                (content) => {

                    values.photo = content;

                    console.log(values);
                    values.save().then(user=>{
                        
                        this.addLine(user);

                        this.formEl.reset();

                        btn.disabled = false;

                    });                  

                }, 
                (e) => {
                    console.error(e);
                }
            );                    

        });

    }

    getPhoto(formEl){

        return new Promise((resolve, reject)=>{

            let fileReader = new FileReader();

            let elements = [...formEl.elements].filter(item=>{

                if (item.name === 'photo') {
                    return item;
                }

            });

            let file = elements[0].files[0];

            fileReader.onload = ()=>{            

                resolve(fileReader.result);

            };

            fileReader.onerror = (e)=> {

                reject(e);

            };

            if (file) {                                
                fileReader.readAsDataURL(file);
            } else {
                resolve('dist/img/boxed-bg.jpg');
            }

        });        

    }

    getValues(formEl){

        let user = {};
        let isValid = true;

        [...formEl.elements].forEach(function (field, index){

            if (!field.value) {

                if (!field.type === "submit") {

                field.parentElement.classList.add('has-error');
                isValid = false; 

                }

            }
            
            if (field.name == "gender") {

                if (field.checked) {
                    user[field.name] = field.value;
                }

            } else if(field.name == "admin") {
        
                user[field.name] = field.checked;
        
            } else {

                user[field.name] = field.value;

            }
        
        });

        if (!isValid) {             
            return false;                       
        }

        return new User(
            user.name,
            user.gender, 
            user.birth, 
            user.country, 
            user.email, 
            user.password, 
            user.photo, 
            user.admin
        );         

    }    

    selectAll(){

        //let users = User.getUsersStorage();

        HttpRequest.get('/users').then(data=>{

            data.users.forEach(dataUser=>{

                let user = new User();                
    
                user.loadFromJSON(dataUser);
    
                this.addLine(user);
    
            });

        }); 

    };    

    addLine(dataUser){ 
        
        let tr = this.getTr(dataUser);                   
        
        this.tableEl.appendChild(tr);

        this.updateCount();

    }

    getTr(dataUser, tr = null){

        if (tr === null) tr = document.createElement('tr'); 

        tr.dataset.user = JSON.stringify(dataUser);          

        tr.innerHTML = `        
            <td><img src="${dataUser._photo}" alt="User Image" class="img-circle img-sm"></td>
            <td>${dataUser._name}</td>
            <td>${dataUser._email}</td>
            <td>${(dataUser._admin) ? 'Sim' : 'Não'}</td>
            <td>${Utils.dateFormat(dataUser._register)}</td>
            <td>
                <button type="button" class="btn btn-primary btn-xs btn-flat" id="edit">Editar</button>
                <button type="button" class="btn btn-danger btn-xs btn-flat" id="delete">Excluir</button>
            </td>        
        `; 

        this.addEventsTr(tr);

        return tr;

    }

    addEventsTr(tr){

        tr.querySelector("#delete").addEventListener("click", e =>{

            if (confirm("Deseja realmente excluir?")) {

                let user = new User();

                user.loadFromJSON(JSON.parse(tr.dataset.user));

                user.remove();

                tr.remove();

                this.updateCount();
            }

        });

        tr.querySelector("#edit").addEventListener("click", e =>{

            let json = JSON.parse(tr.dataset.user);

            this.formElUpdate.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json){

                let field = this.formElUpdate.querySelector("[name=" + name.replace("_", "") + "]");

                if (field) {

                    switch (field.type) {

                        case 'file':
                        continue;
                        break;
                        
                        case 'radio':
                            field = this.formElUpdate.querySelector("[name=" + name.replace("_", "") + "][value="+json[name]+"]");
                            field.checked = true;
                        break;

                        case 'checkbox':
                            field.checked = json[name];
                        break;

                        default:
                            field.value = json[name];
                    }                               
                }

            }

            this.formElUpdate.querySelector(".photo").src = json._photo;

            this.showPanelUpdate();

        });

    }

    showPanelCreate(){

        document.querySelector("#box-user-create").style.display = "block";
        document.querySelector("#box-user-update").style.display = "none";

    }

    showPanelUpdate(){

        document.querySelector("#box-user-create").style.display = "none";
        document.querySelector("#box-user-update").style.display = "block";

    }

    updateCount(){

        let numberUsers = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr=>{

            numberUsers++;

            let user = JSON.parse(tr.dataset.user);

            if (user._admin) numberAdmin++;

        });

        document.querySelector("#number-users").innerHTML = numberUsers;
        document.querySelector("#number-users-admin").innerHTML = numberAdmin;
    }

}