"""
Brevskabelon som Word-fil til Resights' brevmodul.

Resights fletter kun i Word-filer. En PDF bliver trykt, som den er — med
{{fornavn}} stående i klar tekst. Og Resights sætter selv modtagerens
adresse på, så skabelonen har ingen adresseblok (ligesom Pensionist brev 4,
der gik ud til 961 modtagere).

Hvert flettefelt skrives som ét samlet tekststykke. Word-filer deler ellers
gerne tekst op i flere bidder, og et felt der er delt («{{forn» + «avn}}»),
kan en flettemotor ikke finde.

Kør:  python3 scripts/brev/brev_docx.py
"""
from pathlib import Path
from docx import Document
from docx.shared import Pt, Mm, RGBColor
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

VAULT = Path.home() / 'Desktop/Claude Vault/Projects/Brevkampagne ejerforeninger'
UD = VAULT / 'Beboende ejer brev 2.docx'
QR = VAULT / 'QR saelg.365ejendom.dk.png'

PETROL = RGBColor(0x14, 0x5D, 0x5F)
TEKST = RGBColor(0x1F, 0x2A, 0x2B)
GRAA = RGBColor(0x5B, 0x68, 0x68)

doc = Document()
s = doc.sections[0]
s.page_width, s.page_height = Mm(210), Mm(297)
s.left_margin = s.right_margin = Mm(22)
s.top_margin, s.bottom_margin = Mm(22), Mm(18)

normal = doc.styles['Normal']
normal.font.name = 'Arial'
normal.element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial')
normal.font.size = Pt(10.5)
normal.font.color.rgb = TEKST
normal.paragraph_format.space_after = Pt(0)
normal.paragraph_format.line_spacing = 1.3


def afsnit(dele, efter=6, foer=0, size=None, color=None, container=None, linje=None):
    """dele: str eller liste af (tekst, fed). Hver del bliver ét run."""
    p = (container or doc).add_paragraph()
    pf = p.paragraph_format
    pf.space_after, pf.space_before = Pt(efter), Pt(foer)
    if linje:
        pf.line_spacing = linje
    for tekst, fed in ([(dele, False)] if isinstance(dele, str) else dele):
        r = p.add_run(tekst)
        r.bold = fed
        if size: r.font.size = Pt(size)
        if color: r.font.color.rgb = color
    return p


def celle_fyld(celle, hex_):
    tcPr = celle._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), hex_)
    tcPr.append(shd)


def rammer(tabel, hex_, sz=4):
    tblPr = tabel._tbl.tblPr
    b = OxmlElement('w:tblBorders')
    for kant in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        e = OxmlElement(f'w:{kant}')
        e.set(qn('w:val'), 'single'); e.set(qn('w:sz'), str(sz)); e.set(qn('w:color'), hex_)
        b.append(e)
    tblPr.append(b)


def celle_tekst(celle, tekst, fed=False, color=None, size=9.5):
    p = celle.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(tekst); r.bold = fed; r.font.size = Pt(size)
    if color: r.font.color.rgb = color


def lås_bredder(tabel, bredder):
    """Faste kolonnebredder. Ellers fordeler Word/LibreOffice kolonnerne ligeligt."""
    tabel.autofit = False
    tblPr = tabel._tbl.tblPr
    layout = OxmlElement('w:tblLayout'); layout.set(qn('w:type'), 'fixed'); tblPr.append(layout)
    for kol, w in zip(tabel.columns, bredder):
        kol.width = w
        for c in kol.cells:
            c.width = w


def celle_margin(tabel, top=50, bund=50, venstre=100, hoejre=100):
    tblPr = tabel._tbl.tblPr
    m = OxmlElement('w:tblCellMar')
    for kant, v in (('top', top), ('bottom', bund), ('left', venstre), ('right', hoejre)):
        e = OxmlElement(f'w:{kant}'); e.set(qn('w:w'), str(v)); e.set(qn('w:type'), 'dxa'); m.append(e)
    tblPr.append(m)


# ── Overskrift ──
afsnit([('Et kontant bud på din lejlighed', True)], efter=2, size=18, color=PETROL, linje=1.1)
afsnit('Uden mægler. Uden fremvisninger. Og du kan blive boende.', efter=12, size=11, color=PETROL)

# ── Brødtekst ──
afsnit([('Hej ', False), ('{{fornavn}}', False)])
afsnit([('Vi vil gerne købe din lejlighed på ', False), ('{{ejendomsadresse}}', False),
        ('. Kontant og direkte, uden mægler.', False)])
afsnit('Du får dette brev, fordi vi allerede ejer lejligheder i din ejerforening. Vi kender bygningen '
       'og foreningen, så vi kan give dig et konkret bud hurtigt. Siden 2020 har vi købt mere end 85 '
       'boliger direkte af sælgere på Sjælland, og vi køber for at eje og udleje, ikke for at sælge videre.',
       efter=10)

# ── Sammenligning ──
rækker = [
    ('Salær og udbud', 'Typisk 50–80.000 kr.', '0 kr.'),
    ('Fremvisninger', 'Åbent hus og fremmede i dit hjem', 'Ingen. Lejligheden kommer ikke til salg'),
    ('Betaling', 'Afhænger af købers bank', 'Kontant. Intet bankforbehold'),
    ('Overtagelse', 'Når køberen er klar', 'Når du er klar'),
    ('Bagefter', 'Du skal flytte', 'Du kan ofte blive boende som lejer'),
]
t = doc.add_table(rows=1 + len(rækker), cols=3)
t.alignment = WD_TABLE_ALIGNMENT.CENTER
rammer(t, 'C9D8D8'); celle_margin(t)
lås_bredder(t, (Mm(44), Mm(60), Mm(62)))
h = t.rows[0].cells
celle_fyld(h[0], 'F2F6F6'); celle_fyld(h[1], 'F2F6F6'); celle_fyld(h[2], '145D5F')
celle_tekst(h[1], 'Almindeligt salg', fed=True, color=GRAA)
celle_tekst(h[2], 'Salg til 365 Ejendomme', fed=True, color=RGBColor(0xFF, 0xFF, 0xFF))
for i, (a, b, c) in enumerate(rækker, start=1):
    cs = t.rows[i].cells
    celle_tekst(cs[0], a, fed=True)
    celle_tekst(cs[1], b, color=GRAA)
    celle_fyld(cs[2], 'EAF3F3'); celle_tekst(cs[2], c, fed=True)

# ── Situationer ──
afsnit([('Hvad end din situation er', True)], efter=1, foer=12)
afsnit('Måske har du fundet din drømmebolig og vil hurtigt videre, uden at vente på en køber. Måske vil du '
       'have friværdien ud, men blive i dit hjem som lejer. Eller måske er det noget helt tredje. Du bestemmer '
       'selv tidspunktet, i dag eller om et halvt år, og vi gennemgår alle vilkår med dig, før du beslutter noget.',
       efter=12)

# ── Handling med QR ──
b = doc.add_table(rows=1, cols=2)
b.alignment = WD_TABLE_ALIGNMENT.CENTER
rammer(b, '145D5F', sz=12); celle_margin(b, top=140, bund=140, venstre=180, hoejre=180)
venstre, hoejre = b.rows[0].cells
lås_bredder(b, (Mm(134), Mm(32)))
venstre.paragraphs[0].paragraph_format.space_after = Pt(3)
r = venstre.paragraphs[0].add_run('Se dit bud på et par minutter'); r.bold = True; r.font.size = Pt(11.5); r.font.color.rgb = PETROL
afsnit([('Scan koden, eller gå ind på ', False), ('saelg.365ejendom.dk', True),
        (' og skriv din adresse. Så får du et foreløbigt bud med det samme. Det er gratis og forpligter dig '
         'ikke til noget.', False)], efter=4, container=venstre)
afsnit([('Vil du hellere tale med et menneske, så ring direkte til mig på ', False), ('61 78 90 71', True),
        ('.', False)], efter=0, container=venstre)
hoejre.vertical_alignment = 1  # midten
hoejre.paragraphs[0].add_run().add_picture(str(QR), width=Mm(26))

# ── Hilsen ──
afsnit('Venlig hilsen', efter=4, foer=14)
afsnit('Jacob Fast Lisby', efter=0)
afsnit('365ejendom ApS', efter=16)
afsnit([('P.S. ', True), ('Du behøver ikke have planer om at sælge for at scanne koden. Det kan være rart bare '
        'at vide, hvad din lejlighed er værd i dag. Buddet er dit at tage stilling til, nu, senere eller aldrig.',
        False)], efter=0)

doc.save(UD)
print('Gemt:', UD)
