# Genera el PDF desde docs/informe-tpi.md. Requiere reportlab.
from pathlib import Path
import re
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4

root=Path(__file__).resolve().parents[1]
out=root/'output/pdf/informe-tpi-bd2.pdf'
out.parent.mkdir(parents=True,exist_ok=True)
fonts=Path('C:/Windows/Fonts')
if (fonts/'segoeui.ttf').exists():
    pdfmetrics.registerFont(TTFont('Body',str(fonts/'segoeui.ttf')))
    pdfmetrics.registerFont(TTFont('Head',str(fonts/'segoeuib.ttf')))
else:
    from reportlab import rl_config
    fontdir=Path(__import__('reportlab').__file__).parent/'fonts'
    pdfmetrics.registerFont(TTFont('Body',str(fontdir/'Vera.ttf')))
    pdfmetrics.registerFont(TTFont('Head',str(fontdir/'VeraBd.ttf')))
navy=colors.HexColor('#17334B');teal=colors.HexColor('#007D86')
styles={
 'h1':ParagraphStyle('h1',fontName='Head',fontSize=22,leading=28,textColor=navy,spaceAfter=17),
 'h2':ParagraphStyle('h2',fontName='Head',fontSize=12,leading=16,textColor=teal,spaceBefore=11,spaceAfter=6),
 'p':ParagraphStyle('p',fontName='Body',fontSize=10,leading=14,spaceAfter=7,textColor=colors.HexColor('#263746')),
 'cell':ParagraphStyle('cell',fontName='Body',fontSize=9,leading=12,spaceAfter=0),
 'th':ParagraphStyle('th',fontName='Head',fontSize=9,leading=12,textColor=colors.white),
}
width=A4[0]-100
story=[]
def paragraph(text,kind='p'):return Paragraph(escape(text),styles[kind])
def make_table(rows):
 n=len(rows[0])
 widths=([width*0.29,width*0.71] if n==2 else [width*.49]+[width*.17]*3 if n==4 else [width/n]*n)
 data=[[paragraph(c,'th' if i==0 else 'cell') for c in row] for i,row in enumerate(rows)]
 t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([
 ('BACKGROUND',(0,0),(-1,0),navy),('VALIGN',(0,0),(-1,-1),'TOP'),
 ('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),
 ('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),
 ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#F1F6F8'),colors.white]),
 ('LINEBELOW',(0,0),(-1,0),0.5,navy),
 ]))
 return t
text=(root/'docs/informe-tpi.md').read_text(encoding='utf-8')
pages=text.split('\n---\n')
for page_number,block in enumerate(pages):
 if page_number:story.append(PageBreak())
 lines=block.strip().splitlines();i=0
 while i<len(lines):
  line=lines[i].strip()
  if not line:i+=1;continue
  if line.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    cells=[s.strip() for s in lines[i].strip().strip('|').split('|')]
    if not all(re.fullmatch(r'[-: ]+',c) for c in cells):rows.append(cells)
    i+=1
   story.append(make_table(rows));story.append(Spacer(1,9));continue
  if line.startswith('# '):story.append(paragraph(line[2:],'h1'))
  elif line.startswith('## '):story.append(paragraph(line[3:],'h2'))
  else:story.append(paragraph(line))
  i+=1
def frame(canvas,doc):
 canvas.setStrokeColor(teal);canvas.setLineWidth(1)
 canvas.line(50, A4[1]-36, A4[0]-50, A4[1]-36)
 canvas.setFont('Body',8);canvas.setFillColor(navy)
 canvas.drawString(50,25,'TPI Bases de Datos 2 | Informe para revision | 23/10/2026')
 canvas.drawRightString(A4[0]-50,25,str(doc.page))
doc=SimpleDocTemplate(str(out),pagesize=A4,rightMargin=50,leftMargin=50,topMargin=54,bottomMargin=48,
 title='TPI Bases de Datos 2 - Informe tecnico',author='Matias Yacob, Javier y Brenda Florencia Romero')
doc.build(story,onFirstPage=frame,onLaterPages=frame)
print(out)
