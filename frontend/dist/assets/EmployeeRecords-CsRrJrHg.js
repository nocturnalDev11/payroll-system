import{a as y}from"./index-t--hEgTQ.js";import{h}from"./moment-C5S46NFB.js";import{_ as w,c,a as o,b as D,e as m,F as g,m as f,t as l,w as C,T as S,n as T,u as b,o as u,g as _,v,h as E}from"./index-D08fRg5P.js";const P={name:"EmployeeRecords",data(){return{employees:[],currentEmployee:null,selectedMonth:"",errorMessage:"",statusMessage:"",showTaxModal:!1,taxContributions:[],filteredTaxContributions:[],allTaxContributions:{},currentDate:new Date("2025-03-19"),showUpdateModal:!1,selectedEmployeeForUpdate:"",newPosition:"",newSalary:""}},mounted(){this.fetchEmployeeData()},methods:{async fetchEmployeeData(){var t,r,d,a;const e=b();try{const i=await y.get("/api/employees",{headers:{"user-role":e.userRole||"admin","user-id":((t=e.admin)==null?void 0:t.id)||((r=e.employee)==null?void 0:r.id)||"1",Authorization:`Bearer ${e.accessToken}`}}),n=Array.isArray(i.data)?i.data:[];if(n.length===0){this.errorMessage="No employee records found.",this.employees=[];return}this.employees=n.map(s=>({...s,positionHistory:Array.isArray(s.positionHistory)&&s.positionHistory.length>0?s.positionHistory:[{position:s.position||"N/A",salary:s.salary||0,startDate:s.hireDate||this.currentDate.toISOString().split("T")[0],endDate:null}],name:s.name||`${s.firstName||""} ${s.lastName||""}`.trim(),position:this.getLatestPosition(s).position,salary:this.getLatestPosition(s).salary,salaryMonth:s.salaryMonth||h(s.hireDate).format("YYYY-MM")})),await this.fetchAllTaxContributions(),this.errorMessage=""}catch(i){this.errorMessage=((a=(d=i.response)==null?void 0:d.data)==null?void 0:a.error)||"Failed to load employee records. Please check your connection or try again later.",this.employees=[],console.error("Error fetching employee data:",i)}},async fetchAllTaxContributions(){const e=b();try{const t=await y.get("/api/tax-contributions",{headers:{"user-role":e.userRole||"admin",Authorization:`Bearer ${e.accessToken}`}}),r=Array.isArray(t.data)?t.data:[];this.allTaxContributions=r.reduce((d,a)=>(d[a.employeeId]||(d[a.employeeId]=[]),d[a.employeeId].push(a),d),{})}catch(t){console.error("Error fetching tax contributions:",t),this.showErrorMessage("Failed to load tax contributions. Generating locally."),this.allTaxContributions={}}},openTaxModal(e){this.currentEmployee=e,this.selectedMonth="",this.calculateTaxContributions(),this.showTaxModal=!0},getLatestPosition(e){if(!Array.isArray(e.positionHistory)||e.positionHistory.length===0)return{position:e.position||"N/A",salary:e.salary||0,startDate:e.hireDate||this.currentDate.toISOString().split("T")[0]};const t=[...e.positionHistory].sort((r,d)=>new Date(d.startDate)-new Date(r.startDate));return t.find(r=>!r.endDate)||t[0]},getActivePositionForDate(e,t){var a;if(!Array.isArray(e)||e.length===0)return{position:"N/A",salary:0,startDate:((a=this.currentEmployee)==null?void 0:a.hireDate)||this.currentDate.toISOString().split("T")[0]};const r=h(t);return e.find(i=>{const n=h(i.startDate),s=i.endDate?h(i.endDate):h(this.currentDate);return r.isSameOrAfter(n,"day")&&r.isSameOrBefore(s,"day")})||e[e.length-1]},calculateTaxContributions(){if(!this.currentEmployee)return;const e=h(this.currentEmployee.hireDate),t=h(this.currentDate),r=[];let d=this.allTaxContributions[this.currentEmployee.id]||[],a=e.clone().startOf("month");for(;a.isSameOrBefore(t,"day");){const i=a.month(),n=a.year(),s=h({year:n,month:i,date:15});s.isSameOrAfter(e,"day")&&s.isSameOrBefore(t,"day")&&r.push(s.toDate());const x=a.clone().endOf("month");x.isSameOrAfter(e,"day")&&x.isSameOrBefore(t,"day")&&r.push(x.toDate()),a.add(1,"month").startOf("month")}this.taxContributions=r.map(i=>{const n=this.getActivePositionForDate(this.currentEmployee.positionHistory,i),s=n.salary,x=h(i).format("YYYY-MM"),p=d.find(M=>h(M.payDate).isSame(i,"day"))||{};return{payDate:i,position:n.position,salary:s,sss:p.sss||this.calculateSSSContribution(s),philhealth:p.philhealth||this.calculatePhilHealthContribution(s),hdmf:p.hdmf||this.calculatePagIBIGContribution(s),withholdingTax:p.withholdingTax||this.calculateWithholdingTax({...this.currentEmployee,salary:s}),salaryMonth:x,employeeId:this.currentEmployee.id}}),this.filterTaxContributions()},filterTaxContributions(){if(!this.selectedMonth)this.filteredTaxContributions=[...this.taxContributions];else{const e=h(this.selectedMonth,"YYYY-MM");this.filteredTaxContributions=this.taxContributions.filter(t=>h(t.payDate).isSame(e,"month"))}},async saveTaxContributions(){if(!this.taxContributions.length){this.showErrorMessage("No tax contributions to save.");return}try{const e=this.taxContributions.map(r=>({employeeId:Number(r.employeeId),payDate:h(r.payDate).format("YYYY-MM-DD"),sss:Number(r.sss),philhealth:Number(r.philhealth),hdmf:Number(r.hdmf),withholdingTax:Number(r.withholdingTax),position:r.position,salary:Number(r.salary),salaryMonth:r.salaryMonth})),t=await y.post("/api/tax-contributions",e,{headers:{"user-role":"admin"}});(t.status===201||t.status===200)&&(this.allTaxContributions[this.currentEmployee.id]=this.taxContributions,this.showSuccessMessage("Tax contributions saved successfully!"))}catch(e){console.error("Error saving tax contributions:",e),this.showErrorMessage(`Failed to save tax contributions: ${e.message}`)}},generateCSV(){if(!this.filteredTaxContributions.length){this.showErrorMessage("No tax contributions available to export.");return}const e=["Pay Date","Position","Salary","SSS","PhilHealth","HDMF","Withholding Tax","Total"],t=this.filteredTaxContributions.map(s=>[h(s.payDate).format("YYYY-MM-DD"),s.position,s.salary,s.sss,s.philhealth,s.hdmf,s.withholdingTax,s.sss+s.philhealth+s.hdmf+s.withholdingTax]),r=[e.join(","),...t.map(s=>s.join(","))].join(`
`),d=this.selectedMonth?`Tax_Contributions_${this.currentEmployee.name}_${this.selectedMonth}.csv`:`Tax_Contributions_${this.currentEmployee.name}_All_Periods.csv`,a=new Blob([r],{type:"text/csv;charset=utf-8;"}),i=window.URL.createObjectURL(a),n=document.createElement("a");n.href=i,n.setAttribute("download",d),document.body.appendChild(n),n.click(),document.body.removeChild(n),window.URL.revokeObjectURL(i),this.showSuccessMessage("CSV file generated successfully!")},async updateEmployeePosition(){if(!this.selectedEmployeeForUpdate||!this.newPosition||!this.newSalary){this.showErrorMessage("Please fill all fields.");return}try{const e=this.employees.find(a=>a.id===this.selectedEmployeeForUpdate),t=h(this.currentDate).format("YYYY-MM-DD"),r=e.positionHistory.map(a=>a.endDate?a:{...a,endDate:t});r.push({position:this.newPosition,salary:Number(this.newSalary),startDate:t,endDate:null}),(await y.put(`/api/employees/${e.id}`,{...e,position:this.newPosition,salary:Number(this.newSalary),positionHistory:r},{headers:{"user-role":"admin"}})).status===200&&(e.position=this.newPosition,e.salary=Number(this.newSalary),e.positionHistory=r,this.showSuccessMessage(`Position updated for ${e.name} to ${this.newPosition}!`),this.showUpdateModal=!1,this.currentEmployee=e,this.calculateTaxContributions(),await this.saveTaxContributions())}catch(e){console.error("Error updating position:",e),this.showErrorMessage(`Failed to update position: ${e.message}`)}},calculateSSSContribution(e){const t=Math.min(Math.max(e||0,5e3),35e3)||0;return Math.round(t*.045)||0},calculatePhilHealthContribution(e){const r=Math.min(e||0,1e5)||0;return Math.round(r*.05/2)||0},calculatePagIBIGContribution(e){const r=Math.min(e||0,1e4)||0;return Math.round(r*.02)||0},calculateWithholdingTax(e){const t=e.salary||0;return t<=20833?0:t<=33333?Math.round((t-20833)*.15)||0:t<=66667?Math.round(1875+(t-33333)*.2)||0:t<=166667?Math.round(13541.8+(t-66667)*.25)||0:t<=666667?Math.round(90841.8+(t-166667)*.3)||0:Math.round(408841.8+(t-666667)*.35)||0},formatDate(e){return h(e).format("MMM DD, YYYY")},showSuccessMessage(e){this.statusMessage=e,setTimeout(()=>this.statusMessage="",3e3)},showErrorMessage(e){this.statusMessage=e,setTimeout(()=>this.statusMessage="",3e3)}}},Y={class:"min-h-screen p-1"},A={class:"max-w-8xl mx-auto"},k={class:"bg-white p-6 rounded-xl shadow-md"},N={key:0,class:"min-w-full border border-gray-300"},H=["onClick"],I={class:"border px-4 py-2 text-sm text-gray-900"},L={class:"border px-4 py-2 text-sm text-gray-900"},O={class:"border px-4 py-2 text-sm text-gray-900"},F={class:"border px-4 py-2 text-sm text-gray-900"},B={class:"border px-4 py-2 text-sm text-gray-900"},R={class:"border px-4 py-2 text-sm text-gray-900"},U={key:1,class:"text-center py-8 text-gray-500"},V={key:0,class:"fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"},j={class:"bg-white p-5 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto"},z={class:"flex justify-between items-center mb-4"},G={class:"text-lg font-bold text-gray-800"},W={class:"mb-4"},q={key:0,class:"space-y-4"},J={class:"min-w-full border border-gray-300"},K={class:"border px-4 py-2 text-sm text-gray-900"},Q={class:"border px-4 py-2 text-sm text-gray-900"},X={class:"border px-4 py-2 text-sm text-gray-900"},Z={class:"border px-4 py-2 text-sm text-gray-900"},$={class:"border px-4 py-2 text-sm text-gray-900"},tt={class:"border px-4 py-2 text-sm text-gray-900"},et={class:"border px-4 py-2 text-sm text-gray-900"},st={class:"border px-4 py-2 text-sm text-gray-900 font-semibold"},ot={key:1,class:"text-center text-gray-500 py-4"},at={class:"mt-4 flex justify-end gap-3"};function rt(e,t,r,d,a,i){return u(),c("div",Y,[o("div",A,[o("div",k,[t[10]||(t[10]=o("div",{class:"mb-6"},[o("h2",{class:"text-2xl font-semibold text-gray-900"},"My Employee Records")],-1)),a.employees&&a.employees.length?(u(),c("table",N,[t[5]||(t[5]=o("thead",{class:"bg-gray-200"},[o("tr",null,[o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"ID"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"Name"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"Position"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"Salary"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"Hire Date"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"Period")])],-1)),o("tbody",null,[(u(!0),c(g,null,f(a.employees,n=>(u(),c("tr",{key:n.id,class:"hover:bg-gray-50 cursor-pointer",onClick:s=>i.openTaxModal(n)},[o("td",I,l(n.id),1),o("td",L,l(n.name),1),o("td",O,l(n.position),1),o("td",F,"₱"+l(n.salary.toLocaleString()),1),o("td",B,l(i.formatDate(n.hireDate)),1),o("td",R,l(n.salaryMonth),1)],8,H))),128))])])):(u(),c("div",U,l(a.errorMessage||"Loading employee data..."),1)),D(S,{name:"modal-fade"},{default:C(()=>{var n;return[a.showTaxModal?(u(),c("div",V,[o("div",j,[o("div",z,[o("h2",G," Tax Contributions - "+l((n=a.currentEmployee)==null?void 0:n.name),1),o("button",{onClick:t[0]||(t[0]=s=>a.showTaxModal=!1),class:"text-gray-500 hover:text-gray-700",title:"Close Modal"},t[6]||(t[6]=[o("span",{class:"material-icons-outlined"},"close",-1)]))]),o("div",W,[t[7]||(t[7]=o("label",{class:"text-sm font-medium text-gray-700"},"Filter by Month (optional):",-1)),_(o("input",{"onUpdate:modelValue":t[1]||(t[1]=s=>a.selectedMonth=s),type:"month",class:"border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all w-full mt-1",onChange:t[2]||(t[2]=(...s)=>i.filterTaxContributions&&i.filterTaxContributions(...s))},null,544),[[v,a.selectedMonth]])]),a.filteredTaxContributions.length>0?(u(),c("div",q,[o("table",J,[t[8]||(t[8]=o("thead",{class:"bg-gray-100"},[o("tr",null,[o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"Pay Date"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"Position"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"Salary"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"SSS"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"PhilHealth"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"HDMF"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"Withholding Tax"),o("th",{class:"border px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"},"Total")])],-1)),o("tbody",null,[(u(!0),c(g,null,f(a.filteredTaxContributions,s=>(u(),c("tr",{key:s.payDate,class:"hover:bg-gray-50"},[o("td",K,l(i.formatDate(s.payDate)),1),o("td",Q,l(s.position),1),o("td",X,"₱"+l(s.salary.toLocaleString()),1),o("td",Z,"₱"+l(s.sss.toLocaleString()),1),o("td",$,"₱"+l(s.philhealth.toLocaleString()),1),o("td",tt,"₱"+l(s.hdmf.toLocaleString()),1),o("td",et,"₱"+l(s.withholdingTax.toLocaleString()),1),o("td",st," ₱"+l((s.sss+s.philhealth+s.hdmf+s.withholdingTax).toLocaleString()),1)]))),128))])])])):(u(),c("div",ot," No tax contributions available"+l(a.selectedMonth?` for ${a.selectedMonth}`:"")+". ",1)),o("div",at,[o("button",{onClick:t[3]||(t[3]=(...s)=>i.generateCSV&&i.generateCSV(...s)),class:"py-1 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center gap-1"},t[9]||(t[9]=[o("span",{class:"material-icons-outlined text-sm"},"download",-1),E(" Generate CSV ")])),o("button",{onClick:t[4]||(t[4]=s=>a.showTaxModal=!1),class:"py-1 px-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"}," Close ")])])])):m("",!0)]}),_:1}),a.statusMessage?(u(),c("div",{key:2,class:T([a.statusMessage.includes("successfully")?"bg-green-50 text-green-700":"bg-red-50 text-red-700","mt-4 p-3 rounded-lg text-center"])},l(a.statusMessage),3)):m("",!0)])])])}const dt=w(P,[["render",rt],["__scopeId","data-v-b3b9f794"]]);export{dt as default};
