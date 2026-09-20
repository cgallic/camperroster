import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import openpyxl
import import_camp_workbooks as importer


class HistoricalImportTests(unittest.TestCase):
    def fixture(self, directory, rows):
        book = openpyxl.Workbook()
        sheet = book.active
        sheet.title = 'Returning Campers'
        sheet.append(['Registration ID','First Name','Last Name','Paid','Paid'])
        for row in rows:
            sheet.append(row)
        book.save(Path(directory)/'2022 test.xlsx')

    def test_dedup_preserves_source_and_does_not_infer_operational_state(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(importer.SHEETS,{2022:[('Returning Campers','camper')]},clear=True):
            self.fixture(directory,[[1,'Alex','Example',10,20],[1,'Alex','Example',10,20],[2,'Sam','Example',5,15]])
            records,receipt=importer.extract(Path(directory),'camp-test')
            self.assertEqual(len(records),2)
            self.assertEqual(receipt['duplicates'],1)
            source=records[0]['source_data']
            self.assertEqual(source['Paid [column 4]'],'10')
            self.assertEqual(source['Paid [column 5]'],'20')
            self.assertEqual(len(source['_additional_source_rows']),1)
            self.assertIsNone(records[0]['source_status'])
            self.assertNotIn('attended',records[0])
            self.assertEqual(importer.extract(Path(directory),'camp-test')[0],records)

    def test_conflicting_registration_id_fails_before_database_write(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(importer.SHEETS,{2022:[('Returning Campers','camper')]},clear=True):
            self.fixture(directory,[[1,'Alex','Example',10,20],[1,'Sam','Example',10,20]])
            with self.assertRaisesRegex(ValueError,'Conflicting source registration'):
                importer.extract(Path(directory),'camp-test')


if __name__=='__main__':
    unittest.main()
