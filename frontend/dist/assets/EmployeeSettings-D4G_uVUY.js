import{i as v,x as q,k as A,c as g,o as y,n as ae,g as R,I as oe,a as e,t as P,H as re,_ as le,u as O,j as D,e as C,b as l,y as X,F as ee,m as te,f as G,B as z,p as se,h as ie,d as ne,q as ue}from"./index-D08fRg5P.js";const de=["id","type","value","required","autocomplete"],I={__name:"TextInput",props:{type:{type:String,default:"text"},modelValue:{type:String,required:!0},id:String,required:Boolean,autocomplete:String,class:String},emits:["update:modelValue"],setup(k,{emit:N}){const a=k,i=N,t=v(null);q(()=>a.type,n=>{console.log("TextInput type changed to:",n)}),A(()=>{t.value&&t.value.hasAttribute("autofocus")&&t.value.focus()});const p=n=>{i("update:modelValue",n.target.value)};return(n,f)=>(y(),g("input",{id:k.id,type:k.type,class:ae([a.class||"","w-full","text-gray-800","text-sm","border","border-gray-300","px-4","py-3","rounded-md","focus:border-gray-200","focus:outline-none","focus:ring-2","focus:ring-offset-2","focus:ring-gray-300","transition-colors","duration-300"]),value:k.modelValue,required:k.required,autocomplete:k.autocomplete,onInput:p,ref_key:"input",ref:t},null,42,de))}},ce={class:"text-sm text-red-600 dark:text-red-400"},H={__name:"InputError",props:{message:{type:String}},setup(k){return(N,a)=>R((y(),g("div",null,[e("p",ce,P(k.message),1)],512)),[[oe,k.message]])}},pe={class:"block text-sm font-medium text-gray-700"},me={key:0},ve={key:1},$={__name:"InputLabel",props:{value:{type:String}},setup(k){return(N,a)=>(y(),g("label",pe,[k.value?(y(),g("span",me,P(k.value),1)):(y(),g("span",ve,[re(N.$slots,"default")]))]))}},ge={key:0,class:"text-center text-gray-600"},ye={class:"grid grid-cols-1 sm:grid-cols-2 gap-6"},fe=["selected"],he=["value","selected"],be=["selected"],we=["value","selected"],xe={key:1,class:"text-red-600 text-sm"},ke={key:2,class:"text-green-600 text-sm"},_e={__name:"UpdateDetailsForm",props:["employee"],emits:["employee-updated"],setup(k,{emit:N}){const a=k,i=N;O();const t=v({firstName:"",middleName:"",lastName:"",username:"",email:"",contactInfo:"",position:"",civilStatus:"",salary:"",sss:"",philHealth:"",pagIbig:"",hireDate:new Date().toISOString().slice(0,10)}),p=v(!1),n=v(""),f=v(""),_=v(["Developer","Manager","Designer","Analyst"]),x=v(["Single","Married","Separated","Widowed"]),c=v(""),S=v(""),b=v(""),h=v(!1);q(()=>a.employee,d=>{d&&(t.value={firstName:d.firstName||"",middleName:d.middleName||"",lastName:d.lastName||"",username:d.username||"",email:d.email||"",contactInfo:d.contactInfo||"",position:d.position||"",civilStatus:d.civilStatus||"",salary:d.salary!=null?String(d.salary):"",sss:d.sss||"",philHealth:d.philHealth||"",pagIbig:d.pagIbig||"",hireDate:d.hireDate?new Date(d.hireDate).toISOString().slice(0,10):new Date().toISOString().slice(0,10)})},{immediate:!0});const u=()=>{if(t.value.email){const d=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;c.value=d.test(t.value.email)?"":"Please enter a valid email address."}else c.value=""},j=()=>{if(t.value.contactInfo){const d=/^\d{11}$/;S.value=d.test(t.value.contactInfo)?"":"Please enter a valid 11-digit phone number."}else S.value=""},F=()=>{if(t.value.salary){const d=Number(t.value.salary);isNaN(d)||d<0?b.value="Salary must be a valid non-negative number.":b.value=""}else b.value=""};D(()=>p.value||!!c.value||!!S.value||!!b.value||h.value||!a.employee);const M=()=>{a.employee&&(t.value={firstName:a.employee.firstName||"",middleName:a.employee.middleName||"",lastName:a.employee.lastName||"",username:a.employee.username||"",email:a.employee.email||"",contactInfo:a.employee.contactInfo||"",position:a.employee.position||"",civilStatus:a.employee.civilStatus||"",salary:a.employee.salary!=null?String(a.employee.salary):"",sss:a.employee.sss||"",philHealth:a.employee.philHealth||"",pagIbig:a.employee.pagIbig||"",hireDate:a.employee.hireDate?new Date(a.employee.hireDate).toISOString().slice(0,10):new Date().toISOString().slice(0,10)}),c.value="",S.value="",b.value="",n.value="",f.value=""},L=async()=>{if(u(),j(),F(),c.value||S.value||b.value){n.value="Please fix all validation errors before submitting.";return}if(!a.employee||!a.employee._id){n.value="No employee data available to update.";return}p.value=!0,n.value="",f.value="";try{const s=O().accessToken;if(!s)throw new Error("No authentication token available. Please log in again.");const V={};Object.keys(t.value).forEach(w=>{t.value[w]!==""&&t.value[w]!==null&&(V[w]=t.value[w])}),V.salary&&(V.salary=Number(V.salary));const o=await fetch(`${z}/api/employees/update/${a.employee._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${s}`},body:JSON.stringify(V)});if(!o.ok){const w=o.headers.get("content-type");if(w&&w.includes("application/json")){const U=await o.json();throw new Error(U.message||"Update failed")}else{const U=await o.text();throw new Error(`Update failed with status ${o.status}: ${U}`)}}const m=await o.json();f.value="Employee details updated successfully.",i("employee-updated",m.updatedEmployee)}catch(d){console.error("Update failed:",d),n.value=`Failed to update employee: ${d.message}`}finally{p.value=!1}};return(d,s)=>{var V,o,m,w,U,E,T,J,W,Z,Y,K,Q;return y(),g("div",null,[s[14]||(s[14]=e("header",null,[e("h2",{class:"text-lg font-medium text-gray-900 dark:text-gray-100"}," Profile Information "),e("p",{class:"mt-1 text-sm text-gray-600 dark:text-gray-400"}," Update your account's profile information and email address. ")],-1)),e("form",{onSubmit:G(L,["prevent"]),class:"mt-6 space-y-6"},[h.value?(y(),g("div",ge,"Loading employee details...")):C("",!0),e("div",ye,[e("div",null,[l($,{for:"firstName",value:"First Name"}),l(I,{modelValue:t.value.firstName,"onUpdate:modelValue":s[0]||(s[0]=r=>t.value.firstName=r),id:"firstName",class:"mt-1 block w-full",autocomplete:"given-name",placeholder:((V=a.employee)==null?void 0:V.firstName)||"Enter first name"},null,8,["modelValue","placeholder"])]),e("div",null,[l($,{for:"middleName",value:"Middle Name"}),l(I,{modelValue:t.value.middleName,"onUpdate:modelValue":s[1]||(s[1]=r=>t.value.middleName=r),id:"middleName",class:"mt-1 block w-full",autocomplete:"additional-name",placeholder:((o=a.employee)==null?void 0:o.middleName)||"Enter middle name"},null,8,["modelValue","placeholder"])]),e("div",null,[l($,{for:"lastName",value:"Last Name"}),l(I,{modelValue:t.value.lastName,"onUpdate:modelValue":s[2]||(s[2]=r=>t.value.lastName=r),id:"lastName",class:"mt-1 block w-full",autocomplete:"family-name",placeholder:((m=a.employee)==null?void 0:m.lastName)||"Enter last name"},null,8,["modelValue","placeholder"])]),e("div",null,[l($,{for:"username",value:"Username"}),l(I,{modelValue:t.value.username,"onUpdate:modelValue":s[3]||(s[3]=r=>t.value.username=r),id:"username",class:"mt-1 block w-full",autocomplete:"username",placeholder:((w=a.employee)==null?void 0:w.username)||"Enter username"},null,8,["modelValue","placeholder"])]),e("div",null,[l($,{for:"email",value:"Email"}),l(I,{modelValue:t.value.email,"onUpdate:modelValue":s[4]||(s[4]=r=>t.value.email=r),id:"email",type:"email",class:"mt-1 block w-full",autocomplete:"email",onInput:u,placeholder:((U=a.employee)==null?void 0:U.email)||"Enter email"},null,8,["modelValue","placeholder"]),l(H,{message:c.value,class:"mt-2"},null,8,["message"])]),e("div",null,[l($,{for:"contactInfo",value:"Contact Number"}),l(I,{modelValue:t.value.contactInfo,"onUpdate:modelValue":s[5]||(s[5]=r=>t.value.contactInfo=r),id:"contactInfo",type:"text",class:"mt-1 block w-full",pattern:"\\d{11}",title:"Please enter an 11-digit phone number (e.g., 09123456789)",autocomplete:"tel",onInput:j,placeholder:((E=a.employee)==null?void 0:E.contactInfo)||"Enter contact number"},null,8,["modelValue","placeholder"]),l(H,{message:S.value,class:"mt-2"},null,8,["message"])]),e("div",null,[l($,{for:"position",value:"Position"}),R(e("select",{"onUpdate:modelValue":s[6]||(s[6]=r=>t.value.position=r),id:"position",class:"mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"},[e("option",{value:"",selected:!((T=a.employee)!=null&&T.position)},"Select a position",8,fe),(y(!0),g(ee,null,te(_.value,r=>{var B;return y(),g("option",{key:r,value:r,selected:r===((B=a.employee)==null?void 0:B.position)},P(r),9,he)}),128))],512),[[X,t.value.position]])]),e("div",null,[l($,{for:"civilStatus",value:"Civil Status"}),R(e("select",{"onUpdate:modelValue":s[7]||(s[7]=r=>t.value.civilStatus=r),id:"civilStatus",class:"mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"},[e("option",{value:"",selected:!((J=a.employee)!=null&&J.civilStatus)},"Select civil status",8,be),(y(!0),g(ee,null,te(x.value,r=>{var B;return y(),g("option",{key:r,value:r,selected:r===((B=a.employee)==null?void 0:B.civilStatus)},P(r),9,we)}),128))],512),[[X,t.value.civilStatus]])]),e("div",null,[l($,{for:"salary",value:"Salary"}),l(I,{modelValue:t.value.salary,"onUpdate:modelValue":s[8]||(s[8]=r=>t.value.salary=r),id:"salary",type:"text",class:"mt-1 block w-full",onInput:F,placeholder:(W=a.employee)!=null&&W.salary?String(a.employee.salary):"Enter salary"},null,8,["modelValue","placeholder"]),l(H,{message:b.value,class:"mt-2"},null,8,["message"])]),e("div",null,[l($,{for:"sss",value:"SSS Number"}),l(I,{modelValue:t.value.sss,"onUpdate:modelValue":s[9]||(s[9]=r=>t.value.sss=r),id:"sss",class:"mt-1 block w-full",placeholder:((Z=a.employee)==null?void 0:Z.sss)||"Enter SSS number"},null,8,["modelValue","placeholder"])]),e("div",null,[l($,{for:"philHealth",value:"PhilHealth Number"}),l(I,{modelValue:t.value.philHealth,"onUpdate:modelValue":s[10]||(s[10]=r=>t.value.philHealth=r),id:"philHealth",class:"mt-1 block w-full",placeholder:((Y=a.employee)==null?void 0:Y.philHealth)||"Enter PhilHealth number"},null,8,["modelValue","placeholder"])]),e("div",null,[l($,{for:"pagIbig",value:"Pag-IBIG Number"}),l(I,{modelValue:t.value.pagIbig,"onUpdate:modelValue":s[11]||(s[11]=r=>t.value.pagIbig=r),id:"pagIbig",class:"mt-1 block w-full",placeholder:((K=a.employee)==null?void 0:K.pagIbig)||"Enter Pag-IBIG number"},null,8,["modelValue","placeholder"])]),e("div",null,[l($,{for:"hireDate",value:"Hire Date"}),l(I,{modelValue:t.value.hireDate,"onUpdate:modelValue":s[12]||(s[12]=r=>t.value.hireDate=r),id:"hireDate",type:"date",class:"mt-1 block w-full",value:(Q=a.employee)!=null&&Q.hireDate?new Date(a.employee.hireDate).toISOString().slice(0,10):new Date().toISOString().slice(0,10)},null,8,["modelValue","value"])])]),n.value?(y(),g("div",xe,P(n.value),1)):C("",!0),f.value?(y(),g("div",ke,P(f.value),1)):C("",!0),e("div",{class:"flex items-center gap-4"},[s[13]||(s[13]=e("button",{type:"submit",class:"inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white tracking-wide hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"}," Update Profile ",-1)),e("button",{type:"button",onClick:M,class:"inline-flex items-center px-4 py-2 bg-gray-200 border border-gray-300 rounded-md font-semibold text-gray-700 tracking-wide hover:bg-gray-300 focus:outline-none"}," Reset ")])],32)])}}},Se=le(_e,[["__scopeId","data-v-698ad33d"]]),$e={key:0,class:"text-center text-gray-600"},Ne={class:"relative"},Ie={class:"material-icons"},Pe={class:"relative"},Ue={class:"material-icons"},Ve={key:1,class:"text-red-600 text-sm"},Ee={key:2,class:"text-green-600 text-sm"},De={class:"flex items-center gap-4"},Fe=["disabled"],Ce={__name:"UpdatePasswordForm",setup(k){const N=se(),a=O(),i=D(()=>{var o,m;return((m=(o=a.employee)==null?void 0:o.value)==null?void 0:m.id)||N.params.id}),t=v({password:""}),p=v(""),n=v(!1),f=v(!1),_=v(""),x=v(!1),c=v(""),S=v(""),b=v(!1);A(async()=>{var o,m;if(!i.value&&N.params.id){b.value=!0;try{await a.fetchEmployeeDetails(N.params.id),(m=(o=a.employee)==null?void 0:o.value)!=null&&m.id||(c.value="Employee ID could not be retrieved after fetch.")}catch(w){c.value=`Failed to load employee details: ${w.message}`}finally{b.value=!1}}else i.value||(c.value="No employee ID provided in route or auth store.")});const h=()=>{t.value={password:""},p.value="",n.value=!1,f.value=!1,_.value="",c.value="",S.value=""},u=()=>{const o=t.value.password;o?o.length<8?_.value="Password must be at least 8 characters long.":!/[A-Za-z]/.test(o)||!/[0-9]/.test(o)?_.value="Password must contain letters and numbers.":_.value="":_.value="Password is required."},j=()=>{n.value=!n.value},F=()=>{f.value=!f.value},M=D(()=>{const o=t.value.password;if(!o||o.length<8)return"Weak";const m=/[A-Z]/.test(o),w=/[a-z]/.test(o),U=/[0-9]/.test(o),E=/[^A-Za-z0-9]/.test(o),T=[m,w,U,E].filter(Boolean).length;return o.length>=12&&T>=3?"Strong":o.length>=8&&T>=2?"Medium":"Weak"}),L=D(()=>({"text-red-500":M.value==="Weak","text-yellow-500":M.value==="Medium","text-green-500":M.value==="Strong"})),d=D(()=>t.value.password===p.value),s=D(()=>x.value||!d.value||!!_.value||b.value),V=async()=>{if(!d.value){c.value="Passwords do not match.";return}if(_.value){c.value="Please fix all validation errors before submitting.";return}if(!i.value){c.value="Employee ID is missing.";return}x.value=!0,c.value="";try{const o={password:t.value.password},m=await fetch(`${z}/api/employees/update/${i.value}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${a.accessToken}`},body:JSON.stringify(o)});if(!m.ok){const U=m.headers.get("content-type");if(U&&U.includes("application/json")){const E=await m.json();throw new Error(E.message||"Update failed")}else{const E=await m.text();throw new Error(`Update failed with status ${m.status}: ${E}`)}}const w=await m.json();S.value="Your password has been updated successfully.",h()}catch(o){console.error("Error during password update:",o),c.value=`Update password failed: ${o.message}`}finally{x.value=!1}};return(o,m)=>(y(),g("div",null,[m[2]||(m[2]=e("header",null,[e("h2",{class:"text-lg font-medium text-gray-900 dark:text-gray-100"}," Update Password "),e("p",{class:"mt-1 text-sm text-gray-600 dark:text-gray-400"}," Ensure your account is using a long, random password to stay secure. ")],-1)),e("form",{onSubmit:G(V,["prevent"]),class:"mt-6 space-y-6"},[b.value?(y(),g("div",$e,"Loading employee details...")):C("",!0),e("div",null,[l($,{for:"password",value:"New Password"}),e("div",Ne,[l(I,{id:"password",class:"mt-1 block w-full",modelValue:t.value.password,"onUpdate:modelValue":m[0]||(m[0]=w=>t.value.password=w),type:n.value?"text":"password",required:"",autocomplete:"new-password",onInput:u},null,8,["modelValue","type"]),e("button",{type:"button",class:"absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5",onClick:j},[e("span",Ie,P(n.value?"visibility_off":"visibility"),1)])]),l(H,{message:_.value,class:"mt-2"},null,8,["message"]),e("p",{class:ae(["mt-1 text-xs",L.value])}," Password Strength: "+P(M.value),3)]),e("div",null,[l($,{for:"confirm_password",value:"Confirm Password"}),e("div",Pe,[l(I,{id:"confirm_password",class:"mt-1 block w-full",modelValue:p.value,"onUpdate:modelValue":m[1]||(m[1]=w=>p.value=w),type:f.value?"text":"password",required:"",autocomplete:"new-password"},null,8,["modelValue","type"]),e("button",{type:"button",class:"absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5",onClick:F},[e("span",Ue,P(f.value?"visibility_off":"visibility"),1)])]),l(H,{message:d.value?"":"Passwords do not match.",class:"mt-2"},null,8,["message"])]),c.value?(y(),g("div",Ve,P(c.value),1)):C("",!0),S.value?(y(),g("div",Ee,P(S.value),1)):C("",!0),e("div",De,[e("button",{type:"submit",disabled:s.value,class:"inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white tracking-wide hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"}," Update Password ",8,Fe),e("button",{type:"button",onClick:h,class:"inline-flex items-center px-4 py-2 bg-gray-200 border border-gray-300 rounded-md font-semibold text-gray-700 tracking-wide hover:bg-gray-300 focus:outline-none"}," Reset ")])],32)]))}},je=le(Ce,[["__scopeId","data-v-4dab2306"]]),Me={class:"max-w-3xl"},Te={class:"hs-file-upload","data-hs-file-upload":`{\r
          "url": "/api/employees/profile-picture",\r
          "acceptedFiles": "image/*",\r
          "maxFiles": 1,\r
          "singleton": true\r
        }`},Be={class:"flex flex-wrap items-center gap-3 sm:gap-5"},ze={class:"flex-shrink-0"},He={key:0,class:"size-20 flex items-center justify-center overflow-hidden"},Oe=["src"],Ae={class:"grow"},Le={class:"flex items-center gap-x-2"},Re=["disabled"],qe={key:0,class:"text-red-500 text-xs mt-1"},Ge={__name:"UploadProfilePicture",props:{employee:{type:Object,default:()=>({})}},emits:["employeeUpdated"],setup(k,{emit:N}){const a=N,i=O(),t=v(null),p=v(null),n=v(null),f=D(()=>{var u;const h=(u=i.employee)==null?void 0:u.profilePicture;return p.value?URL.createObjectURL(p.value):h?`${z}${h}`:null}),_=()=>{t.value.click()},x=async h=>{const u=h.target.files[0];if(u){if(!["image/jpeg","image/png","image/jpg"].includes(u.type)){n.value="Only JPEG/JPG/PNG images are allowed";return}if(u.size>5*1024*1024){n.value="File size must be less than 5MB";return}p.value=u,await c()}},c=async()=>{if(!p.value)return;const h=new FormData;h.append("profilePicture",p.value);try{const u=await fetch(`${z}/api/employees/profile-picture`,{method:"POST",headers:{Authorization:`Bearer ${i.accessToken}`},body:h});if(!u.ok){const F=await u.text();throw console.error("Upload failed:",u.status,F),new Error(`Upload failed: ${u.statusText} - ${F}`)}const j=await u.json();i.employee.profilePicture=j.profilePicture,i.saveEmployee(),p.value=null,n.value=null,a("employeeUpdated",i.employee)}catch(u){n.value=`Failed to upload profile picture: ${u.message}`,p.value=null,console.error("Upload error details:",u)}},S=async()=>{try{const h=await fetch(`${z}/api/employees/update/${i.employee.id}`,{method:"PUT",headers:{Authorization:`Bearer ${i.accessToken}`,"Content-Type":"application/json"},body:JSON.stringify({profilePicture:null})});if(!h.ok){const u=await h.text();throw new Error(`Failed to clear profile picture: ${h.statusText} - ${u}`)}i.employee.profilePicture=null,i.saveEmployee(),p.value=null,t.value.value="",n.value=null,a("employeeUpdated",i.employee)}catch(h){n.value=`Failed to remove profile picture: ${h.message}`,console.error("Clear error details:",h)}},b=()=>{n.value="Failed to load profile picture",p.value=null};return q(()=>i.employee,()=>{p.value},{deep:!0}),(h,u)=>(y(),g("div",Me,[u[4]||(u[4]=e("header",{class:"pb-6"},[e("h2",{class:"text-lg font-medium text-gray-900 dark:text-gray-100"},"Profile Picture"),e("p",{class:"mt-1 text-sm text-gray-600 dark:text-gray-400"},"Update your profile picture.")],-1)),e("form",{onSubmit:G(c,["prevent"])},[e("div",Te,[e("div",Be,[e("div",ze,[f.value?(y(),g("div",He,[e("img",{src:f.value,class:"w-full h-full object-cover rounded-full",alt:"Profile preview",onError:b},null,40,Oe)])):(y(),g("span",{key:1,class:"flex justify-center items-center size-20 border-2 border-dotted border-gray-300 text-gray-400 cursor-pointer rounded-full hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-600 dark:hover:bg-neutral-700/50",onClick:_},u[0]||(u[0]=[e("svg",{class:"shrink-0 size-7",xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"1.5","stroke-linecap":"round","stroke-linejoin":"round"},[e("circle",{cx:"12",cy:"12",r:"10"}),e("circle",{cx:"12",cy:"10",r:"3"}),e("path",{d:"M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"})],-1)])))]),e("div",Ae,[e("div",Le,[e("button",{type:"button",class:"py-2 px-3 inline-flex items-center gap-x-2 text-xs font-medium rounded-lg border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none",onClick:_},u[1]||(u[1]=[e("svg",{class:"shrink-0 size-4",xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round"},[e("path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}),e("polyline",{points:"17 8 12 3 7 8"}),e("line",{x1:"12",x2:"12",y1:"3",y2:"15"})],-1),ie(" Upload photo ")])),e("button",{type:"button",class:"py-2 px-3 inline-flex items-center gap-x-2 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-500 shadow-2xs hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none",onClick:S,disabled:!f.value},u[2]||(u[2]=[ne('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-4 icon icon-tabler icons-tabler-outline icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>',1)]),8,Re),e("input",{ref_key:"fileInput",ref:t,type:"file",class:"hidden",accept:"image/*",onChange:x},null,544)]),n.value?(y(),g("p",qe,P(n.value),1)):C("",!0)])]),u[3]||(u[3]=e("div",{class:"flex justify-end"},[e("button",{type:"submit",class:"inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white tracking-wide hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"}," Update Photo ")],-1))])],32)]))}},Je={class:"space-y-2"},We={key:0,class:"text-center text-gray-600"},Ze={key:1,class:"text-red-600 text-center"},Ye={key:2,class:"space-y-3"},Ke={class:"bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800"},Qe={class:"bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800"},Xe={class:"bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800"},et={key:3,class:"text-gray-600 text-center"},at={__name:"EmployeeSettings",setup(k){const N=se(),a=ue(),i=O(),t=v(i.employee),p=v(!0),n=v(null),f=D(()=>i.employee);A(async()=>{var c,S;let x=N.params.id||((c=i.employee)==null?void 0:c.id);if(!x){n.value="No employee ID provided. Please ensure you are logged in.",p.value=!1;return}if(!i.isAuthenticated){n.value="You must be logged in to view this page.",p.value=!1,a.push("/login");return}if(i.userRole==="employee"&&x!=((S=i.employee)==null?void 0:S.id)){a.push(`/employees/${i.employee.id}/settings`);return}try{if(p.value=!0,await i.fetchEmployeeDetails(x),!f.value||!f.value._id)throw new Error("Employee data not found or invalid")}catch(b){console.error("Failed to fetch employee:",b),n.value=b.message||"Failed to load employee data",(b.message.includes("Access denied")||b.message.includes("not authenticated"))&&(i.logout(),a.push("/employee-login"))}finally{p.value=!1}}),A(async()=>{var x;if((x=i.employee)!=null&&x.id)try{await i.fetchEmployeeDetails(i.employee.id),t.value=i.employee}catch(c){console.error("Failed to fetch employee:",c)}});const _=x=>{t.value=x,console.log("Employee updated:",x)};return(x,c)=>(y(),g("div",Je,[c[0]||(c[0]=e("h2",{class:"pb-5 text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200"}," Settings ",-1)),p.value?(y(),g("div",We," Loading employee details... ")):n.value?(y(),g("div",Ze,P(n.value),1)):f.value?(y(),g("div",Ye,[e("div",Ke,[l(Ge,{employee:t.value,onEmployeeUpdated:_,class:"max-w-3xl"},null,8,["employee"])]),e("div",Qe,[l(Se,{employee:f.value,onEmployeeUpdated:_,class:"max-w-3xl"},null,8,["employee"])]),e("div",Xe,[l(je,{class:"max-w-3xl"})])])):(y(),g("div",et," No employee data available. "))]))}};export{at as default};
