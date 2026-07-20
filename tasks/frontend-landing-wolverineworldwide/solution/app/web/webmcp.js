(function () {
  "use strict";
  const DESTINATIONS = ["hero","brand-portfolio","annual-report","culture-statement","market-snapshot","latest-news","culture-stats","awards","careers-cta","mobile-menu","responsibility-dropdown","investor-briefing","command-palette"];
  const DESTINATION_IDS = { hero:"hero","brand-portfolio":"portfolio","annual-report":"annual-report","culture-statement":"culture","market-snapshot":"market","latest-news":"latest-news","culture-stats":"culture-stats",awards:"awards","careers-cta":"careers" };
  const MODULES = ["browse-query-v1","entity-collection-v1","form-workflow-v1","artifact-transfer-v1"];
  const app = () => window.NorthstarApp;
  const objectSchema = (properties, required) => ({ type:"object", properties, required, additionalProperties:false });
  const titleSchema = { type:"string", enum:[
    "Northstar Earns People-First Workplace Certification","Trailmark Celebrates 45 Years Outside","Cadence Velocity Pro Wins Best Racing Shoe","Northstar Studio Receives Four Creative Honors","Cadence Brings the Daily Runner Back","Trailmark Launches a Flow-Focused Trail Shoe","Forgeworks Steps Onto the Small Screen","Northstar Named Company of the Year"
  ]};
  const consentProperties = { necessary:{type:"boolean"},analytics:{type:"boolean"},marketing:{type:"boolean"},functional:{type:"boolean"} };
  const tools = [];
  function tool(name,module,description,input_schema,handler){tools.push({name,module,description,input_schema,handler});}

  tool("browse_open","browse-query-v1","Open a bounded homepage section or chrome destination through the same visible handlers.",objectSchema({destination:{type:"string",enum:DESTINATIONS}},["destination"]),(args)=>{
    const destination=args.destination;
    if(DESTINATION_IDS[destination]){const opened=app().openSection(DESTINATION_IDS[destination]);return opened.ok?{...opened,destination}:opened;}
    if(destination==="mobile-menu"){app().openMobile();return{ok:true,destination};}
    if(destination==="responsibility-dropdown"){app().openResponsibility();return{ok:true,destination};}
    if(destination==="investor-briefing"){app().openBriefing();return{ok:true,destination};}
    if(destination==="command-palette"){app().openCommand();return{ok:true,destination};}
    return{ok:false,error:"unknown destination"};
  });
  tool("browse_search","browse-query-v1","Open the real command palette and apply a bounded text query.",objectSchema({query:{type:"string",minLength:0,maxLength:120}},["query"]),(args)=>{app().openCommand();const input=document.querySelector("#command-search");if(!input)return{ok:false,error:"command palette unavailable"};input.value=args.query;input.dispatchEvent(new Event("input",{bubbles:true}));return{ok:true,query:args.query,visible_results:document.querySelectorAll("#command-results li").length};});
  tool("browse_apply_filter","browse-query-v1","Filter Latest News to all stories or the pinned shortlist.",objectSchema({filter:{type:"string",enum:["all","pinned"]}},["filter"]),(args)=>app().setFilter(args.filter));
  tool("browse_clear_filter","browse-query-v1","Clear the Latest News filter.",objectSchema({},[]),()=>app().clearFilter());
  tool("browse_sort","browse-query-v1","Sort Latest News in original or reverse order.",objectSchema({sort:{type:"string",enum:["original","reverse"]}},["sort"]),(args)=>app().sortNews(args.sort));
  tool("browse_set_locale","browse-query-v1","Apply the only locally authored locale, English.",objectSchema({locale:{type:"string",enum:["en"]}},["locale"]),(args)=>{document.documentElement.lang=args.locale;return{ok:true,locale:args.locale};});
  tool("browse_set_theme","browse-query-v1","Apply the bounded Northstar monochrome theme.",objectSchema({theme:{type:"string",enum:["monochrome"]}},["theme"]),(args)=>{document.documentElement.dataset.theme=args.theme;return{ok:true,theme:args.theme};});

  tool("entity_create","entity-collection-v1","Pin a declared news story using the same pin command as its card.",objectSchema({title:titleSchema},["title"]),(args)=>app().setPinned(args.title,true));
  tool("entity_select","entity-collection-v1","Reveal a declared news story card without changing pin state.",objectSchema({title:titleSchema},["title"]),(args)=>{app().openSection("latest-news");const card=Array.from(document.querySelectorAll(".news-card")).find((node)=>node.dataset.title===args.title);if(!card)return{ok:false,error:"news card unavailable"};card.scrollIntoView({block:"nearest",inline:"center"});card.querySelector(".pin-button").focus();return{ok:true,title:args.title,pinned:app().state.pinnedTitles.includes(args.title)};});
  tool("entity_delete","entity-collection-v1","Unpin a declared story after explicit confirmation.",objectSchema({title:titleSchema,confirm:{type:"boolean",const:true}},["title","confirm"]),(args)=>args.confirm===true?app().setPinned(args.title,false):{ok:false,error:"confirm must be true"});
  tool("entity_toggle","entity-collection-v1","Toggle a declared story through the same command as the visible Pin to briefing button.",objectSchema({title:titleSchema},["title"]),(args)=>app().togglePinned(args.title));

  tool("form_validate","form-workflow-v1","Validate all four consent fields and show named errors in the real preferences form.",objectSchema(consentProperties,["necessary","analytics","marketing","functional"]),(args)=>{app().openPreferences(args);const result=app().validateConsent(args);document.querySelectorAll("[data-error]").forEach((node)=>{node.textContent=result.errors[node.dataset.error]||"";});return{ok:result.valid,errors:result.errors};});
  tool("form_submit","form-workflow-v1","Submit consent through the same validated save handler as the visible form.",objectSchema(consentProperties,["necessary","analytics","marketing","functional"]),(args)=>{app().openPreferences(args);return app().applyConsent(args,"save preferences");});
  tool("form_cancel","form-workflow-v1","Cancel the open preferences form through its visible Close control.",objectSchema({},[]),()=>{const close=document.querySelector("#preferences-close");if(!close||document.querySelector("#preferences-modal").hidden)return{ok:false,error:"preferences form is not open"};close.click();return{ok:true,cancelled:true};});
  tool("form_reset","form-workflow-v1","Reset the visible consent draft to the session consent values.",objectSchema({},[]),()=>{app().openPreferences(app().state.consent);return{ok:true,draft:{...app().state.consent}};});

  tool("artifact_import","artifact-transfer-v1","Open the real Import briefing surface for paste or file interaction; artifact contents remain browser mechanics.",objectSchema({mode:{type:"string",enum:["paste","file"]}},["mode"]),(args)=>{app().openBriefing();const target=args.mode==="file"?document.querySelector("#import-file"):document.querySelector("#import-text");target.focus();return{ok:true,mode:args.mode,status:"awaiting visible browser input"};});
  tool("artifact_export","artifact-transfer-v1","Download the active briefing format through the same export handler as the visible control.",objectSchema({format:{type:"string",enum:["json","markdown"]}},["format"]),(args)=>{app().openBriefing();app().setFormat(args.format);return app().downloadBriefing();});
  tool("artifact_copy","artifact-transfer-v1","Copy the active visible briefing through the same Copy briefing handler.",objectSchema({format:{type:"string",enum:["json","markdown"]}},["format"]),async(args)=>{app().openBriefing();app().setFormat(args.format);return await app().copyBriefing();});

  function listed(){return tools.map(({handler,...definition})=>definition);}
  window.webmcp_session_info=()=>({contract_version:"zto-webmcp-v1",app:"northstar-collective-home",modules:MODULES,bindings:{browsable_entity:"homepage-section",destinations:DESTINATIONS,entity:"news-pin",entity_operations:["create","select","delete","toggle"],entity_fields:["title","pinned"],form_fields:["necessary","analytics","marketing","functional"],form_operations:["validate","submit","cancel","reset"],artifact_operations:["import","export","copy"],export_formats:["json","markdown"],import_modes:["paste","file"]},tools:tools.map((item)=>item.name)});
  window.webmcp_list_tools=listed;
  window.webmcp_invoke_tool=async(name,args)=>{const found=tools.find((item)=>item.name===name);if(!found)return{ok:false,error:"unknown tool",name};try{return await found.handler(args||{});}catch(error){return{ok:false,error:error instanceof Error?error.message:String(error)};}};
  try{if(!navigator.modelContext)navigator.modelContext={listTools:listed,callTool:window.webmcp_invoke_tool};}catch(_){}
})();
