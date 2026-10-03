(function(root){
  "use strict";
  const emptyProjectData=()=>({measurements:[],notes:[],attachments:[],records:[]});
  const state={view:"list",projects:[],selected:null,loading:true,error:"",formError:"",ready:false,activating:null,history:[],historyError:"",calculationResult:null,calculationInput:{},projectData:emptyProjectData(),projectDataError:""};
  let projectService=null,projectDataService=null,calculationRepository=null,calculationEngine=null,formulaRegistry=null,installed=false,attachmentUrls=[];
  const registry=()=>root.EngineeringModuleRegistry;
  const message=error=>error?.message||"工程專案發生未知錯誤。";

  function snapshot(){return {modules:registry()?.list?.()||[],failures:registry()?.failures?.()||[],formulas:formulaRegistry?.listFormulas?.()||[]};}
  function markup(){
    const common=snapshot();
    if(state.view==="workspace")return root.EngineeringProjectWorkspace.render({...common,project:state.selected,error:state.error,formError:state.formError,history:state.history,historyError:state.historyError,calculationResult:state.calculationResult,calculationInput:state.calculationInput,projectData:state.projectData,projectDataError:state.projectDataError});
    return root.EngineeringHome.render({...common,projects:state.projects,loading:state.loading,error:state.error,formError:state.formError});
  }
  function render(){
    try{return markup();}
    catch(error){console.error("Engineering Hub failed safely",error);return `<section class="engineering-hub engineering-unavailable"><div class="eyebrow">ENGINEERING HUB</div><h1>工程中心暫時無法載入</h1><p>立之雲端庫其他功能不受影響。</p><button class="button" data-route="home">返回立之雲端庫</button></section>`;}
  }
  function renderPanel(){const panel=document.querySelector('[data-panel="engineering"]');if(panel&&!panel.hidden)panel.innerHTML=render();}
  async function runtime(){
    if(projectService)return projectService;
    const persistence=root.EngineeringDatabase.createPersistence();
    const projectRepository=root.EngineeringProjectRepository.create({persistence});
    calculationRepository=root.EngineeringCalculationRepository.create({persistence});
    const measurementRepository=root.EngineeringMeasurementRepository.create({persistence}),noteRepository=root.EngineeringNoteRepository.create({persistence}),attachmentRepository=root.EngineeringAttachmentRepository.create({persistence}),projectRecordRepository=root.EngineeringProjectRecordRepository.create({persistence});
    formulaRegistry=root.EngineeringFormulaRegistryApi.createRegistry({moduleRegistry:registry(),neutralNamespaces:["demo"]});
    formulaRegistry.registerPack(root.EngineeringDemoFormulaPack);
    try{
      if(!root.EngineeringWoodworkingFormulaPack)throw new Error("Woodworking Formula Pack is unavailable");
      formulaRegistry.registerPack(root.EngineeringWoodworkingFormulaPack);
    }catch(error){registry()?.recordFailure?.(error);console.warn("Woodworking Formula Pack failed safely",error);}
    calculationEngine=root.EngineeringCalculationEngine.create({formulaRegistry,calculationRepository});
    projectService=root.EngineeringProjectService.create({repository:projectRepository,registry:registry(),workspaceId:await persistence.getWorkspaceId()});
    projectDataService=root.EngineeringProjectDataService.create({projectService,measurementRepository,noteRepository,attachmentRepository,projectRecordRepository,attachmentStorage:root.EngineeringAttachmentStorage.create()});
    return projectService;
  }
  async function refresh(){
    state.loading=true;state.error="";renderPanel();
    try{state.projects=await (await runtime()).listProjects();state.ready=true;}
    catch(error){console.error("Engineering projects failed safely",error);state.error=message(error);}
    finally{state.loading=false;renderPanel();}
  }
  function activate(){if(state.activating)return state.activating;if(state.ready){renderPanel();return Promise.resolve();}state.activating=refresh().finally(()=>{state.activating=null;});return state.activating;}
  async function loadHistory(projectId){
    state.historyError="";
    try{state.history=await calculationRepository.listByProject(projectId);}
    catch(error){state.history=[];state.historyError=message(error);console.warn("Engineering calculation history failed safely",error);}
  }
  function revokeAttachmentUrls(){for(const url of attachmentUrls)root.URL?.revokeObjectURL?.(url);attachmentUrls=[];}
  async function loadProjectData(projectId){
    state.projectDataError="";revokeAttachmentUrls();
    try{
      const data=await projectDataService.listProjectData(projectId),attachments=[];
      for(const metadata of data.attachments){try{const content=await projectDataService.getAttachmentContent(projectId,metadata.id),preview_url=root.URL?.createObjectURL?.(content.blob)||"";if(preview_url)attachmentUrls.push(preview_url);attachments.push({...metadata,preview_url});}catch(error){attachments.push({...metadata,preview_error:message(error)});}}
      state.projectData={...data,attachments};
    }catch(error){state.projectData=emptyProjectData();state.projectDataError=message(error);console.warn("Engineering project data failed safely",error);}
  }
  async function openProject(project){
    state.selected=project;state.view="workspace";state.formError="";state.calculationResult=null;state.calculationInput={};state.history=[];state.projectData=emptyProjectData();renderPanel();
    await runtime();await Promise.all([loadHistory(project.id),loadProjectData(project.id)]);renderPanel();
  }
  async function perform(operation,{stay=false}={}){
    state.formError="";state.error="";
    try{
      const result=await operation(await runtime());
      state.projects=await projectService.listProjects();
      if(result&&!stay)await openProject(result);
      else if(state.selected)state.selected=state.projects.find(project=>project.id===state.selected.id)||null;
    }catch(error){state.formError=message(error);console.warn("Engineering project action rejected safely",error);}
    renderPanel();
  }
  function checkedModules(form){return [...form.querySelectorAll('input[name="module_ids"]:checked')].map(input=>input.value);}
  async function calculate(form){
    const data=Object.fromEntries(new FormData(form));state.calculationInput={...data};state.calculationResult=null;renderPanel();
    try{state.calculationResult=await calculationEngine.calculate({project_id:state.selected.id,formula_id:data.formula_id,input:Object.fromEntries(Object.entries(data).filter(([key])=>key!=="formula_id"))});await loadHistory(state.selected.id);}
    catch(error){state.calculationResult={ok:false,formula_id:data.formula_id,formula_version:null,result:null,warnings:[],errors:[{code:"FORMULA_EXECUTION_ERROR",message:message(error)}],meta:{}};}
    renderPanel();
  }
  async function projectDataAction(operation){state.projectDataError="";try{await operation();await loadProjectData(state.selected.id);}catch(error){state.projectDataError=message(error);console.warn("Engineering project data action rejected safely",error);}renderPanel();}
  function measurementData(form){const data=Object.fromEntries(new FormData(form));return{type:data.type,label:data.label,values:{value:Number(data.value)},units:{value:data.unit},notes:data.notes||"",source:"manual"};}
  async function submitProjectData(form){
    const kind=form.dataset.engineeringForm,data=Object.fromEntries(new FormData(form)),projectId=state.selected.id;
    if(kind==="measurement-create")return projectDataAction(()=>projectDataService.createMeasurement(projectId,measurementData(form)));
    if(kind==="measurement-update")return projectDataAction(()=>projectDataService.updateMeasurement(projectId,form.dataset.entityId,measurementData(form)));
    if(kind==="note-create")return projectDataAction(()=>projectDataService.createNote(projectId,{title:data.title,content:data.content}));
    if(kind==="note-update")return projectDataAction(()=>projectDataService.updateNote(projectId,form.dataset.entityId,{title:data.title,content:data.content}));
    if(kind==="record-create")return projectDataAction(()=>projectDataService.createRecord(projectId,{record_type:data.record_type,title:data.title,content:data.content}));
    if(kind==="attachment-create")return projectDataAction(()=>projectDataService.addAttachment(projectId,form.querySelector('input[type="file"]')?.files?.[0],{displayName:data.display_name||undefined}));
  }
  function installEvents(app){
    if(installed||!app)return;installed=true;
    app.addEventListener("submit",event=>{
      const form=event.target.closest("[data-engineering-form]");if(!form)return;
      event.preventDefault();event.stopImmediatePropagation();
      if(form.dataset.engineeringForm==="calculate"){void calculate(form);return;}
      if(["measurement-create","measurement-update","note-create","note-update","record-create","attachment-create"].includes(form.dataset.engineeringForm)){void submitProjectData(form);return;}
      const name=String(new FormData(form).get("name")||"").trim(),module_ids=checkedModules(form);
      if(form.dataset.engineeringForm==="create")void perform(api=>api.createProject({name,module_ids}));
      if(form.dataset.engineeringForm==="update")void perform(api=>api.updateProject(form.dataset.projectId,{name,module_ids}));
    },true);
    app.addEventListener("change",event=>{
      if(!event.target.matches("[data-engineering-formula]"))return;
      state.calculationInput={formula_id:event.target.value};state.calculationResult=null;renderPanel();
    },true);
    app.addEventListener("click",event=>{
      const button=event.target.closest("button");if(!button)return;
      if(button.dataset.engineeringOpen){const project=state.projects.find(item=>item.id===button.dataset.engineeringOpen);if(project)void openProject(project);}
      if(button.dataset.engineeringAction==="back"){revokeAttachmentUrls();state.view="list";state.selected=null;state.formError="";state.history=[];state.projectData=emptyProjectData();state.calculationResult=null;renderPanel();}
      if(button.dataset.engineeringAction==="retry")void refresh();
      if(button.dataset.engineeringArchive)void perform(api=>api.archiveProject(button.dataset.engineeringArchive));
      if(button.dataset.engineeringReopen)void perform(api=>api.reopenProject(button.dataset.engineeringReopen),{stay:state.view==="list"});
      if(button.dataset.engineeringDeleteType&&button.dataset.engineeringDeleteId){const type=button.dataset.engineeringDeleteType,id=button.dataset.engineeringDeleteId,projectId=state.selected.id;const actions={measurement:()=>projectDataService.deleteMeasurement(projectId,id),note:()=>projectDataService.deleteNote(projectId,id),attachment:()=>projectDataService.deleteAttachment(projectId,id),record:()=>projectDataService.deleteRecord(projectId,id)};if(actions[type])void projectDataAction(actions[type]);}
    },true);
  }
  root.EngineeringHub=Object.freeze({render,snapshot,activate,refresh,installEvents});
})(typeof globalThis!=="undefined"?globalThis:this);
