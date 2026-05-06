import pandas as pd

def read_excel_backlog(file_path):
    # Read the excel file
    df = pd.read_excel(file_path)
    # Output the first few rows to understand structure
    print(df.to_string())

path = r'd:\DoAnCNCNPM\DoAnChuyenNganhCongNghePhanMem\docs\BT_Tuan07\BaoCaoTienDo_PhanCongNhiemVu.xlsx'
read_excel_backlog(path)
