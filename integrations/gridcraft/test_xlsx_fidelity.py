"""Isolated regression tests: no private Excel files are part of the test suite."""
from __future__ import annotations

import io
import json
import os
import posixpath
import tempfile
import unittest
import contextlib
import warnings
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

import gridcraft_xlsx_fidelity as fid

PKG = "http://schemas.openxmlformats.org/package/2006/relationships"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
Q = lambda n: "{"+S+"}"+n

def synthetic_parts():
    return {
        '[Content_Types].xml': b'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>',
        'xl/workbook.xml': (f'<workbook xmlns="{S}" xmlns:r="{R}"><workbookPr date1904="0"/>'
                 '<sheets><sheet name="Demo" sheetId="7" r:id="rId1"/></sheets>'
                 '<definedNames><definedName name="TestName">Demo!$A$1</definedName></definedNames></workbook>').encode(),
        'xl/_rels/workbook.xml.rels':(f'<Relationships xmlns="{PKG}">'
                  f'<Relationship Id="rId1" Type="{R}/worksheet" Target="worksheets/custom.xml"/>'
                  '</Relationships>').encode(),
        'xl/worksheets/custom.xml':(f'<worksheet xmlns="{S}"><dimension ref="A1:C3"/>'
                  '<cols><col min="1" max="1" width="14" customWidth="1"/></cols>'
                  '<sheetData><row r="1" ht="25" customHeight="1">'
                  '<c r="A1" s="1"><f t="shared" si="0" ref="A1:A3">B1+$C$1+"A1"</f><v>3</v></c>'
                  '<c r="B1" t="s"><v>0</v></c><c r="C1" t="n"><v>2</v></c></row>'
                  '<row r="2"><c r="A2" s="1"><f t="shared" si="0"/><v>5</v></c>'
                  '<c r="B2" t="inlineStr"><is><t>Plain</t></is></c></row>'
                  '<row r="3"><c r="A3" s="1"><f t="shared" si="0"/><v>6</v></c></row>'
                  '</sheetData><mergeCells count="1"><mergeCell ref="B2:C2"/></mergeCells>'
                  '<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75"/>'
                  '<pageSetup orientation="portrait" paperSize="9"/>'
                  '</worksheet>').encode(),
        'xl/sharedStrings.xml':(f'<sst xmlns="{S}"><si><t>PrivateString</t></si></sst>').encode(),
        'xl/styles.xml':(f'<styleSheet xmlns="{S}">'
                    '<fonts count="2"><font/><font><b/></font></fonts>'
                    '<fills count="1"><fill/></fills><borders count="1"><border/></borders>'
                    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
                    '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>'
                    '<xf numFmtId="14" fontId="1" fillId="0" borderId="0" xfId="0"/></cellXfs>'
                    '</styleSheet>').encode(),
        'xl/drawings/drawing1.xml': b'<d:wsDr xmlns:d="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"/>',
    }


def zipped(parts):
    stream=io.BytesIO()
    with zipfile.ZipFile(stream,'w',zipfile.ZIP_DEFLATED) as z:
        for k,v in parts.items():z.writestr(k,v)
    return stream.getvalue()


def modified(blob, part, mutator):
    with zipfile.ZipFile(io.BytesIO(blob)) as z: parts={n:z.read(n) for n in z.namelist()}
    root=ET.fromstring(parts[part])
    mutator(root)
    parts[part]=ET.tostring(root,encoding='utf8')
    return zipped(parts)


def cell(root, addr):
    r=root.find(f'.//{Q("c")}[@r="{addr}"]')
    assert r is not None
    return r


class FidelityTests(unittest.TestCase):
    def setUp(self):
        self.source=zipped(synthetic_parts())
        self.src=fid.inventory_bytes(self.source)

    def check_change(self, part, mutate, category=None):
        other=fid.inventory_bytes(modified(self.source,part,mutate))
        d=fid.compare(self.src,other)
        self.assertEqual(d['status'],'DIFFERENT')
        self.assertGreater(d['difference_count'],0)
        if category:self.assertIn(category,d['categories'])
        self.assertEqual(d['privacy'],'VALUES_REDACTED')
        return d

    def test_identity(self):
        d=fid.compare(self.src,self.src)
        self.assertEqual((d['status'],d['difference_count'],d['warnings']),('MATCH',0,[]))
        self.assertEqual(self.src.stats['formula_nodes'],3)
        self.assertEqual(self.src.stats['shared_formula_followers'],2)
        self.assertEqual(self.src.fields['sheet:7:cell:A2:formula'],'B2+$C$1+"A1"')
        self.assertEqual(self.src.fields['sheet:7:cell:A3:formula'],'B3+$C$1+"A1"')

    def test_numeric_value(self):
        self.check_change('xl/worksheets/custom.xml',lambda x:cell(x,'C1').find(Q('v')).__setattr__('text','999'),'cell_value')

    def test_formula_master(self):
        d=self.check_change('xl/worksheets/custom.xml',lambda x:cell(x,'A1').find(Q('f')).__setattr__('text','B1+$C$1+"A1"+1'),'cell_formula')
        self.assertTrue(any(x['key'].endswith('A3:formula') for x in d['differences']))

    def test_formula_cache(self):
        self.check_change('xl/worksheets/custom.xml',lambda x:cell(x,'A2').find(Q('v')).__setattr__('text','888'),'cell_value')

    def test_shared_formula_attribute(self):
        self.check_change('xl/worksheets/custom.xml',lambda x:cell(x,'A1').find(Q('f')).set('t','array'),'cell_formula_kind')

    def test_cell_type(self):
        self.check_change('xl/worksheets/custom.xml',lambda x:cell(x,'C1').set('t','str'),'cell_type')

    def test_shared_string_value(self):
        self.check_change('xl/sharedStrings.xml',lambda x:x.find(f'{Q("si")}/{Q("t")}').__setattr__('text','Different'),'cell_value')

    def test_inline_value(self):
        self.check_change('xl/worksheets/custom.xml',lambda x:cell(x,'B2').find(f'{Q("is")}/{Q("t")}').__setattr__('text','Different'),'cell_value')

    def test_style_font(self):
        self.check_change('xl/styles.xml',lambda x:x.find(f'{Q("fonts")}/{Q("font")}[2]/{Q("b")}').set('val','0'),'cell_style')

    def test_style_index_reorder_semantically_equal(self):
        parts=synthetic_parts()
        root=ET.fromstring(parts['xl/styles.xml'])
        xfs=root.find(Q('cellXfs'))
        xfs[0],xfs[1]=xfs[1],xfs[0]
        parts['xl/styles.xml']=ET.tostring(root,encoding='utf8')
        sheet=ET.fromstring(parts['xl/worksheets/custom.xml'])
        for n in sheet.findall(f'.//{Q("c")}'):
            n.set('s','0' if n.get('s')=='1' else '1')
        parts['xl/worksheets/custom.xml']=ET.tostring(sheet,encoding='utf8')
        result=fid.compare(self.src,fid.inventory_bytes(zipped(parts)))
        self.assertEqual(result['status'],'MATCH')  # Equivalent references should not produce false style diffs.
        self.assertNotIn('cell_style',result['categories'])

    def test_merge(self):
        self.check_change('xl/worksheets/custom.xml',lambda x:x.find(f'{Q("mergeCells")}/{Q("mergeCell")}').set('ref','B2:C3'),'merge')

    def test_col_width(self):
        self.check_change('xl/worksheets/custom.xml',lambda x:x.find(f'{Q("cols")}/{Q("col")}').set('width','25'),'geometry')

    def test_row_height(self):
        self.check_change('xl/worksheets/custom.xml',lambda x:x.find(f'{Q("sheetData")}/{Q("row")}').set('ht','30'),'geometry')

    def test_orientation(self):
        self.check_change('xl/worksheets/custom.xml',lambda x:x.find(Q('pageSetup')).set('orientation','landscape'),'page_print')

    def test_margin(self):
        self.check_change('xl/worksheets/custom.xml',lambda x:x.find(Q('pageMargins')).set('left','0.8'),'page_print')

    def test_sheet_name(self):
        self.check_change('xl/workbook.xml',lambda x:x.find(f'{Q("sheets")}/{Q("sheet")}').set('name','Changed'),'workbook_structure')

    def test_date_system(self):
        self.check_change('xl/workbook.xml',lambda x:x.find(Q('workbookPr')).set('date1904','1'),'workbook_structure')

    def test_defined_name(self):
        self.check_change('xl/workbook.xml',lambda x:x.find(f'{Q("definedNames")}/{Q("definedName")}').__setattr__('text','Demo!$B$2'),'workbook_structure')

    def test_opaque_drawing(self):
        p=synthetic_parts();p['xl/drawings/drawing1.xml']=b'<Changed/>'
        d=fid.compare(self.src,fid.inventory_bytes(zipped(p)))
        self.assertIn('opaque_package',d['categories'])

    def test_opaque_new_member(self):
        p=synthetic_parts();p['xl/extra.xml']=b'<New/>'
        d=fid.compare(self.src,fid.inventory_bytes(zipped(p)))
        self.assertIn('opaque_package',d['categories'])

    def test_missing_cell_detected(self):
        def delete(root):root.find(f'{Q("sheetData")}/{Q("row")}').remove(cell(root,'B1'))
        self.check_change('xl/worksheets/custom.xml',delete,'cell_value')

    def test_redaction_and_opt_in(self):
        p=synthetic_parts();p['xl/sharedStrings.xml']=p['xl/sharedStrings.xml'].replace(b'PrivateString',b'TotallySecret')
        new=fid.inventory_bytes(zipped(p));a=fid.compare(self.src,new)
        self.assertNotIn('PrivateString',json.dumps(a))
        self.assertNotIn('TotallySecret',json.dumps(a))
        b=fid.compare(self.src,new,show_values=True)
        self.assertIn('PrivateString',json.dumps(b))

    def test_max_items(self):
        p=synthetic_parts();p['xl/worksheets/custom.xml']=p['xl/worksheets/custom.xml'].replace(b'B1+$C$1',b'B2+$C$1')
        d=fid.compare(self.src,fid.inventory_bytes(zipped(p)),max_items=1)
        self.assertTrue(d['truncated'])
        self.assertEqual(len(d['differences']),1)

    def test_missing_master_warning(self):
        def drop_master(root):cell(root,'A1').find(Q('f')).set('si','99')
        q=fid.inventory_bytes(modified(self.source,'xl/worksheets/custom.xml',drop_master))
        self.assertTrue(q.warnings)
        self.assertEqual(q.stats['shared_formula_unresolved'],2)

    def test_structured_master_warning(self):
        def structured(root):cell(root,'A1').find(Q('f')).text='SUM(Table1[Column])'
        q=fid.inventory_bytes(modified(self.source,'xl/worksheets/custom.xml',structured))
        self.assertEqual(q.stats['shared_formula_unresolved'],2)
        self.assertTrue(q.warnings)

    def test_shared_formula_translate_absolute(self):
        self.assertEqual(fid.shared_translate('$A1+$B$1+C$1+"C2"','C1','D3'),'$A3+$B$1+D$1+"C2"')

    def test_formula_function_name_is_not_cell(self):
        self.assertEqual(fid.shared_translate('LOG10(A1)+SUM(B1)+"A1"','A1','A2'),'LOG10(A2)+SUM(B2)+"A1"')

    def test_quoted_sheet_reference(self):
        self.assertEqual(fid.shared_translate("'Data Sheet'!A1 + A$1", "A1", "B3"), "'Data Sheet'!B3 + B$1")

    def test_invalid_zip(self):
        with self.assertRaises(fid.WorkbookInvalid):fid.inventory_bytes(b'not a zip')

    def test_duplicate_member(self):
        b=io.BytesIO();p=synthetic_parts()
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            with zipfile.ZipFile(b,'w') as z:
                for k,v in p.items():z.writestr(k,v)
                z.writestr('xl/workbook.xml',p['xl/workbook.xml'])
        with self.assertRaisesRegex(fid.WorkbookInvalid,'duplicate'):fid.inventory_bytes(b.getvalue())

    def test_traversal(self):
        p=synthetic_parts();p['xl/../../secrets.xml']=b'<Secret/>'
        with self.assertRaisesRegex(fid.WorkbookInvalid,'unsafe'):fid.inventory_bytes(zipped(p))

    def test_missing_sheet_part(self):
        p=synthetic_parts();p.pop('xl/worksheets/custom.xml')
        with self.assertRaisesRegex(fid.WorkbookInvalid,'missing'):fid.inventory_bytes(zipped(p))

    def test_external_sheet_rejected(self):
        p=synthetic_parts();p['xl/_rels/workbook.xml.rels']=p['xl/_rels/workbook.xml.rels'].replace(b'Target="worksheets/custom.xml"',b'Target="https://example.invalid/x"')
        with self.assertRaises(fid.WorkbookInvalid):fid.inventory_bytes(zipped(p))

    def test_dtd_rejected(self):
        p=synthetic_parts();p['xl/workbook.xml']=b'<!DOCTYPE x [<!ENTITY e "hi">]>' +p['xl/workbook.xml']
        with self.assertRaisesRegex(fid.WorkbookInvalid,'DTD'):fid.inventory_bytes(zipped(p))

    def test_invalid_shared_string(self):
        p=synthetic_parts();p['xl/worksheets/custom.xml']=p['xl/worksheets/custom.xml'].replace(b'<v>0</v></c><c r="C1"',b'<v>15</v></c><c r="C1"')
        with self.assertRaisesRegex(fid.WorkbookInvalid,'shared string'):fid.inventory_bytes(zipped(p))

    def test_unknown_formula_bounds(self):
        with self.assertRaises(fid.WorkbookInvalid):fid.shared_translate('B1','A1','XFD1048576')

    def test_no_source_file_mutation(self):
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/'sample.xlsx';p.write_bytes(self.source)
            q=fid.inventory_file(p)
            self.assertEqual(q.sha256,fid.sha(self.source))
            self.assertEqual(p.read_bytes(),self.source)

    def test_cli_exit_codes(self):
        with tempfile.TemporaryDirectory() as t:
            p,q,r=(Path(t)/n for n in ('a.xlsx','b.xlsx','out.json'))
            p.write_bytes(self.source);q.write_bytes(self.source)
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(fid.main([str(p),str(q),'--json-out',str(r),'--max-items','0']),0)
            self.assertEqual(json.loads(r.read_text())['privacy'],'VALUES_REDACTED')
            q.write_bytes(b'bad')
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(fid.main([str(p),str(q)]),2)


if __name__=='__main__':
    unittest.main()
