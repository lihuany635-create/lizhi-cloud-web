import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const project=readFileSync('app/project-workspace.tsx','utf8');
const ui=readFileSync('app/employee-essentials.tsx','utf8');
const styles=readFileSync('app/globals.css','utf8');
const handbook=readFileSync('../../docs/AI_EMPLOYEE_HANDBOOK_v1.0.md','utf8');
const intake=readFileSync('../../docs/APP_REQUIREMENTS_INTERVIEW_v1.0.md','utf8');

test('製作工作台有員工必知入口，並能在專案清單及詳細頁切換',()=>{
 assert.match(project,/import EmployeeEssentials from '\.\/employee-essentials';/);
 assert.match(project,/<EmployeeEssentials\/>/);
 assert.match(project,/員工必知/);
 assert.match(project,/setShowEssentials\(false\)/);
 assert.match(ui,/aria-pressed=\{selected===id\}/);
 assert.match(styles,/essentials-fulltext/);
});
test('員工必知包含兩份正式文件路徑與原始文件鏈結',()=>{
 assert.match(ui,/docs\/AI_EMPLOYEE_HANDBOOK_v1\.0\.md/);
 assert.match(ui,/docs\/APP_REQUIREMENTS_INTERVIEW_v1\.0\.md/);
 assert.match(ui,/cache:'no-store'/);
 assert.match(ui,/開啟原始文件/);
 assert.match(handbook,/LIZHI-AI-RULES/);
 assert.match(intake,/LIZHI-APP-INTAKE/);
});
test('App 訪談規範有核心問題、階段性追問、需求確認單及安全邊界',()=>{
 for(const term of ['第 1 輪','第 2 輪','第 3 輪','第 4 輪','第 5 輪','第 6 輪','需求確認單','已確認','待確認','第一版','既有專案','安全']){
  assert.ok(intake.includes(term), 'missing: '+term);
 }
 for(let n=1;n<=36;n++)assert.ok(new RegExp('(?:^|\\n)'+n+'\\. ').test(intake),'missing question '+n);
 assert.match(intake,/不能宣稱寫入成功而未讀回/);
});
