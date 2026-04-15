import json
from pathlib import Path

from openpyxl import Workbook

def json_list_to_xlsx(json_path: Path, xlsx_path: Path) -> None:
    with json_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError(f"Expected a JSON list in {json_path}, got {type(data).__name__}")

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Sheet1"

    for row_index, item in enumerate(data, start=1):
        sheet.cell(row=row_index, column=1, value=str(item))

    workbook.save(xlsx_path)


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent
    input_path = base_dir / "un.json"
    output_path = base_dir / "un.xlsx"

    json_list_to_xlsx(input_path, output_path)
    print(f"Wrote {output_path}")
