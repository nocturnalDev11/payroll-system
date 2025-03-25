import{_ as m,c as o,a as e,t as r,F as h,m as y,o as d,n as c}from"./index-D08fRg5P.js";const p={name:"EmployeeHolidays",data(){return{currentMonthIndex:new Date().getMonth(),months:["January","February","March","April","May","June","July","August","September","October","November","December"],holidays:[{date:"January 1",name:"New Year's Day",type:"Regular Holiday",monthIndex:0},{date:"January 23",name:"First Philippine Republic Day",type:"Special Working",monthIndex:0},{date:"February 25",name:"EDSA People Power Revolution",type:"Special Non-Working",monthIndex:1},{date:"March 31",name:"Holi Festival (Hindu Community)",type:"Special Working",monthIndex:2},{date:"April 6",name:"Maundy Thursday",type:"Regular Holiday",monthIndex:3},{date:"April 7",name:"Good Friday",type:"Regular Holiday",monthIndex:3},{date:"April 9",name:"Araw ng Kagitingan",type:"Regular Holiday",monthIndex:3},{date:"May 1",name:"Labor Day",type:"Regular Holiday",monthIndex:4},{date:"June 12",name:"Independence Day",type:"Regular Holiday",monthIndex:5},{date:"July 6",name:"Eid'l Adha (Feast of Sacrifice)",type:"Regular Holiday",monthIndex:6},{date:"August 21",name:"Ninoy Aquino Day",type:"Special Non-Working",monthIndex:7},{date:"August 28",name:"National Heroes Day",type:"Regular Holiday",monthIndex:7},{date:"September 3",name:"Surrender of Gen. Yamashita",type:"Special Working",monthIndex:8},{date:"October 31",name:"All Saints' Day (Observance)",type:"Special Working",monthIndex:9},{date:"November 1",name:"All Saints' Day",type:"Special Non-Working",monthIndex:10},{date:"November 2",name:"All Souls' Day",type:"Special Non-Working",monthIndex:10},{date:"November 30",name:"Bonifacio Day",type:"Regular Holiday",monthIndex:10},{date:"December 8",name:"Feast of the Immaculate Conception",type:"Special Non-Working",monthIndex:11},{date:"December 24",name:"Christmas Eve",type:"Special Non-Working",monthIndex:11},{date:"December 25",name:"Christmas Day",type:"Regular Holiday",monthIndex:11},{date:"December 30",name:"Rizal Day",type:"Regular Holiday",monthIndex:11},{date:"December 31",name:"New Year's Eve",type:"Special Non-Working",monthIndex:11}]}},computed:{filteredHolidays(){return this.holidays.filter(l=>l.monthIndex===this.currentMonthIndex)}},methods:{prevMonth(){this.currentMonthIndex>0&&this.currentMonthIndex--},nextMonth(){this.currentMonthIndex<this.months.length-1&&this.currentMonthIndex++}}},u={class:"employee-holidays"},x={class:"header-container"},g={class:"month-navigation"},I=["disabled"],b={class:"month-column"},_=["disabled"],v={class:"holidays-container"},M={key:0,class:"holiday-grid"},D={key:1};function H(l,i,S,k,t,a){return d(),o("div",u,[e("div",x,[e("div",g,[e("button",{onClick:i[0]||(i[0]=(...n)=>a.prevMonth&&a.prevMonth(...n)),disabled:t.currentMonthIndex===0},"◀ Prev",8,I),e("div",b,[e("span",null,r(t.months[t.currentMonthIndex]),1)]),e("button",{onClick:i[1]||(i[1]=(...n)=>a.nextMonth&&a.nextMonth(...n)),disabled:t.currentMonthIndex===t.months.length-1},"Next ▶",8,_)])]),e("div",v,[e("h2",null,r(t.months[t.currentMonthIndex])+" Holidays",1),a.filteredHolidays.length>0?(d(),o("div",M,[(d(!0),o(h,null,y(a.filteredHolidays,(n,s)=>(d(),o("div",{key:s,class:"holiday-box"},[e("strong",null,r(n.date),1),e("p",null,r(n.name),1),e("span",{class:c(n.type==="Regular Holiday"?"holiday-type regular":"holiday-type special")},r(n.type),3)]))),128))])):(d(),o("p",D,"No holidays this month."))])])}const f=m(p,[["render",H],["__scopeId","data-v-b951cccd"]]);export{f as default};
