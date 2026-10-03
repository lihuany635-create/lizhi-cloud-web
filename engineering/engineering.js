(function(root){
  "use strict";
  const emptyProjectData=()=>({measurements:[],notes:[],attachments:[],records:[]});
  const emptyVisualization=()=>({mode:"2d",view:"front",azimuth:40,zoom:1,svg2d:"",svg3d:"",error2d:"",error3d:"",sourceIdentity:null,snapshotOnly:false});
  const emptyFurniture=()=>({templates:[],designs:[],templateKey:"",name:"",parameters:{},preview:null,error:"",editing:null,compatibilityWarning:"",visualization:emptyVisualization()});
  const state={view:"list",projects:[],selected:null,loading:true,error:"",formError:"",ready:false,activating:null,history:[],historyError:"",calculationResult:null,calculationInput:{},projectData:emptyProjectData(),projectDataError:"",furniture:emptyFurniture()};
  let projectService=null,projectDataService=null,furnitureDesignService=null,templateRegistry=null,calculationRepository=null,calculationEngine=null,formulaRegistry=null,installed=false,attachmentUrls=[];
  const registry=()=>root.EngineeringModuleRegistry;
  const message=error=>error?.message||"工程專案發生未知錯誤。";

  function snapshot(){return {modules:registry()?.list?.()||[],failures:registry()?.failures?.()||[],formulas:formulaRegistry?.listFormulas?.()||[],templates:templateRegistry?.listTemplates?.()||[]};}
  function markup(){
    const common=snapshot();
    if(state.view==="workspace")return root.EngineeringProjectWorkspace.render({...common,project:state.selected,error:state.error,formError:state.formError,history:state.history,historyError:state.historyError,calculationResult:state.calculationResult,calculationInput:state.calculationInput,projectData:state.projectData,projectDataError:state.projectDataError,furniture:state.furniture});
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
    const designRepository=root.EngineeringDesignRepository.create({persistence});
    templateRegistry=root.EngineeringParametricTemplateRegistryApi.createRegistry();
    for(const definition of[root.EngineeringOpenBoxCabinetTemplate,root.EngineeringOpenBoxCabinetTemplateV11])try{templateRegistry.registerTemplate(definition);}catch(error){templateRegistry.recordFailure(error);registry()?.recordFailure?.(error);console.warn("Furniture Template failed safely",error);}
    formulaRegistry=root.EngineeringFormulaRegistryApi.createRegistry({moduleRegistry:registry(),neutralNamespaces:["demo"]});
    formulaRegistry.registerPack(root.EngineeringDemoFormulaPack);
    try{
      if(!root.EngineeringWoodworkingFormulaPack)throw new Error("Woodworking Formula Pack is unavailable");
      formulaRegistry.registerPack(root.EngineeringWoodworkingFormulaPack);
    }catch(error){registry()?.recordFailure?.(error);console.warn("Woodworking Formula Pack failed safely",error);}
    calculationEngine=root.EngineeringCalculationEngine.create({formulaRegistry,calculationRepository});
    projectService=root.EngineeringProjectService.create({repository:projectRepository,registry:registry(),workspaceId:await persistence.getWorkspaceId()});
    projectDataService=root.EngineeringProjectDataService.create({projectService,measurementRepository,noteRepository,attachmentRepository,projectRecordRepository,attachmentStorage:root.EngineeringAttachmentStorage.create()});
    furnitureDesignService=root.EngineeringFurnitureDesignService.create({templateRegistry,designRepository,projectService});
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
  async function loadFurniture(projectId){
    state.furniture.error="";
    try{const templates=templateRegistry.listTemplates().sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true})),designs=await furnitureDesignService.listByProject(projectId),templateKey=state.furniture.templateKey||`${templates[0]?.id||""}@${templates[0]?.version||""}`;state.furniture={...state.furniture,templates,designs,templateKey};}
    catch(error){state.furniture={...emptyFurniture(),error:message(error)};console.warn("Furniture designs failed safely",error);}
  }
  async function openProject(project){
    state.selected=project;state.view="workspace";state.formError="";state.calculationResult=null;state.calculationInput={};state.history=[];state.projectData=emptyProjectData();state.furniture=emptyFurniture();renderPanel();
    await runtime();await Promise.all([loadHistory(project.id),loadProjectData(project.id),loadFurniture(project.id)]);renderPanel();
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
  const templateIdentity=value=>{const index=String(value).lastIndexOf("@");return{template_id:String(value).slice(0,index),template_version:String(value).slice(index+1)};};
  function refreshVisualization(design){const visualization={...emptyVisualization(),...state.furniture.visualization,error2d:"",error3d:"",svg2d:"",svg3d:""};let source;try{source=root.EngineeringFurnitureRenderingAdapter.fromDesign(design,{templateAvailable:templateRegistry.hasTemplate(design.template_id,design.template_version)});visualization.sourceIdentity={design_id:source.design_id,template_id:source.template_id,template_version:source.template_version,revision:source.revision};visualization.snapshotOnly=source.snapshot_only;}catch(error){visualization.error2d=message(error);visualization.error3d=message(error);state.furniture.visualization=visualization;return;}try{const projection=root.EngineeringFurnitureProjection2D.create(source,visualization.view);visualization.svg2d=root.EngineeringFurnitureSvgRenderer.render(projection);}catch(error){visualization.error2d=message(error);}try{const scene=root.EngineeringFurnitureSceneModel.create(source);visualization.svg3d=root.EngineeringFurnitureRenderer3D.render(scene,{azimuth:visualization.azimuth,zoom:visualization.zoom});}catch(error){visualization.error3d=message(error);}state.furniture.visualization=visualization;}
  async function furnitureAction(form,action){state.furniture.error="";const data=Object.fromEntries(new FormData(form)),identity=templateIdentity(data.template_key),template=templateRegistry.getTemplate(identity.template_id,identity.template_version),parameters={};for(const name of Object.keys(template?.parameter_schema?.fields||{}))parameters[name]=data[name];state.furniture={...state.furniture,templateKey:data.template_key,name:String(data.name||""),parameters};try{if(action==="preview"){state.furniture.preview=await furnitureDesignService.preview({project_id:state.selected.id,...identity,parameters});state.furniture.compatibilityWarning="";}if(action==="save"){const request={name:data.name,parameters};const design=state.furniture.editing?await furnitureDesignService.updateDraft(state.selected.id,state.furniture.editing,request):await furnitureDesignService.saveDraft({project_id:state.selected.id,...identity,...request});await loadFurniture(state.selected.id);state.furniture.editing=design.id;state.furniture.name=design.name;state.furniture.parameters={...design.parameters};state.furniture.preview={template:templateRegistry.getTemplate(design.template_id,design.template_version),parameters:design.parameters,derived_snapshot:design.derived_snapshot,warnings:design.derived_snapshot.warnings||[]};refreshVisualization(design);}}catch(error){state.furniture.error=message(error);if(error?.details?.issues?.length)state.furniture.error+=` ${error.details.issues.map(item=>item.message).join(" ")}`;if(error?.details?.preview)state.furniture.preview=error.details.preview;if(error?.code!=="VALIDATION_ERROR")console.warn("Furniture design action rejected safely",error);}renderPanel();}
  async function editFurniture(designId){try{const result=await furnitureDesignService.getDesign(state.selected.id,designId),design=result.design;state.furniture={...state.furniture,editing:design.id,templateKey:`${design.template_id}@${design.template_version}`,name:design.name,parameters:{...design.parameters},preview:{template:templateRegistry.getTemplate(design.template_id,design.template_version),parameters:design.parameters,derived_snapshot:design.derived_snapshot,warnings:design.derived_snapshot.warnings||[]},compatibilityWarning:result.compatibility_warning||"",error:"",visualization:emptyVisualization()};refreshVisualization(design);}catch(error){state.furniture.error=message(error);}renderPanel();}
  function updateVisualization(action,value){const design=state.furniture.designs.find(item=>item.id===state.furniture.editing);if(!design)return;if(action==="mode")state.furniture.visualization.mode=value;if(action==="view")state.furniture.visualization.view=value;if(action==="rotate")state.furniture.visualization.azimuth+=Number(value);if(action==="zoom")state.furniture.visualization.zoom=Math.min(2,Math.max(.5,state.furniture.visualization.zoom+Number(value)));if(action==="reset")state.furniture.visualization={...emptyVisualization(),mode:"3d"};refreshVisualization(design);renderPanel();}
  function installEvents(app){
    if(installed||!app)return;installed=true;
    app.addEventListener("submit",event=>{
      const form=event.target.closest("[data-engineering-form]");if(!form)return;
      event.preventDefault();event.stopImmediatePropagation();
      if(form.dataset.engineeringForm==="calculate"){void calculate(form);return;}
      if(form.dataset.engineeringForm==="furniture-design"){void furnitureAction(form,event.submitter?.dataset.furnitureAction||"preview");return;}
      if(["measurement-create","measurement-update","note-create","note-update","record-create","attachment-create"].includes(form.dataset.engineeringForm)){void submitProjectData(form);return;}
      const name=String(new FormData(form).get("name")||"").trim(),module_ids=checkedModules(form);
      if(form.dataset.engineeringForm==="create")void perform(api=>api.createProject({name,module_ids}));
      if(form.dataset.engineeringForm==="update")void perform(api=>api.updateProject(form.dataset.projectId,{name,module_ids}));
    },true);
    app.addEventListener("change",event=>{
      if(event.target.matches("[data-engineering-formula]")){state.calculationInput={formula_id:event.target.value};state.calculationResult=null;renderPanel();return;}
      if(event.target.matches("[data-furniture-template]")){state.furniture={...state.furniture,templateKey:event.target.value,parameters:{},preview:null,editing:null,compatibilityWarning:"",error:""};renderPanel();}
    },true);
    app.addEventListener("click",event=>{
      const button=event.target.closest("button");if(!button)return;
      if(button.dataset.engineeringOpen){const project=state.projects.find(item=>item.id===button.dataset.engineeringOpen);if(project)void openProject(project);}
      if(button.dataset.engineeringAction==="back"){revokeAttachmentUrls();state.view="list";state.selected=null;state.formError="";state.history=[];state.projectData=emptyProjectData();state.furniture=emptyFurniture();state.calculationResult=null;renderPanel();}
      if(button.dataset.engineeringAction==="retry")void refresh();
      if(button.dataset.engineeringArchive)void perform(api=>api.archiveProject(button.dataset.engineeringArchive));
      if(button.dataset.engineeringReopen)void perform(api=>api.reopenProject(button.dataset.engineeringReopen),{stay:state.view==="list"});
      if(button.dataset.engineeringDeleteType&&button.dataset.engineeringDeleteId){const type=button.dataset.engineeringDeleteType,id=button.dataset.engineeringDeleteId,projectId=state.selected.id;const actions={measurement:()=>projectDataService.deleteMeasurement(projectId,id),note:()=>projectDataService.deleteNote(projectId,id),attachment:()=>projectDataService.deleteAttachment(projectId,id),record:()=>projectDataService.deleteRecord(projectId,id)};if(actions[type])void projectDataAction(actions[type]);}
      if(button.dataset.furnitureEdit)void editFurniture(button.dataset.furnitureEdit);
      if(button.dataset.furnitureNew){const template=state.furniture.templates[0];state.furniture={...state.furniture,editing:null,templateKey:template?`${template.id}@${template.version}`:"",name:"",parameters:{},preview:null,compatibilityWarning:"",error:"",visualization:emptyVisualization()};renderPanel();}
      if(button.dataset.furnitureArchive)void furnitureDesignService.archiveDesign(state.selected.id,button.dataset.furnitureArchive).then(()=>loadFurniture(state.selected.id)).then(renderPanel).catch(error=>{state.furniture.error=message(error);renderPanel();});
      if(button.dataset.visualizationMode)updateVisualization("mode",button.dataset.visualizationMode);
      if(button.dataset.projectionView)updateVisualization("view",button.dataset.projectionView);
      if(button.dataset.sceneRotate)updateVisualization("rotate",button.dataset.sceneRotate);
      if(button.dataset.sceneZoom)updateVisualization("zoom",button.dataset.sceneZoom);
      if(button.dataset.sceneReset)updateVisualization("reset",0);
    },true);
  }
  root.EngineeringHub=Object.freeze({render,snapshot,activate,refresh,installEvents});
})(typeof globalThis!=="undefined"?globalThis:this);
