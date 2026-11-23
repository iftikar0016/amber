import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="8997e400-f548-4643-970a-754d97f3f452",
    name="Verify Project Tasks in Table View",
    tc_id="TC-35",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "get_three_quotes_listed": "true", "order_tiles_listed": "true", "book_electrician_listed": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "neitzq", "session_value": "neitzq", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='4a5e1674-df2c-4934-810c-78771ec9fdf8'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the login form steps to complete', instruction_id='2d32a710-d42a-4e3d-bbaf-f572754755ac'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='7a8bc9b6-1edb-4786-b3cc-1f7ed3564bf3'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='867a199f-7ffa-4cae-b9f1-940510ad9d29'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='e003e27a-f5df-46e1-95bd-40999aaa80ae'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='5b34e939-e000-4a2a-be90-70528a884485'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Waiting for the signed-in home page to load', instruction_id='bfb86c50-b537-43b3-94b5-58154527a984'):
        await page.wait_for_timeout(500)
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (/Still at it, Amber Demo\\?/.test(el(60).innerText.trim()));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether the home page greeting heading in the main content greets Amber Demo', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='0a0c72c7-1859-4a89-ab62-f29da857d5e7'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in the project list', instruction_id='f3f46332-efeb-40b3-b51b-1d8cf26d7db5'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking the Table view link in the project navigation', instruction_id='b3850392-9443-44f9-8b86-8f787545c61e'):
        _loc_4 = page.locator("internal:role=link[name=\"Table\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Checking whether Get three quotes is listed in the table'):
        set_var('get_three_quotes_listed', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {116: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(116).innerText.trim() === 'Get three quotes');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=cell[name="Get three quotes"i]'], query='whether Get three quotes is present in the task table', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='The table lists Get three quotes.'))
    
    async with testmu.step('Checking whether Order tiles is listed in the table'):
        set_var('order_tiles_listed', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {96: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(96).innerText.trim() === 'Order tiles');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=cell[name="Order tiles"i]'], query='whether Order tiles is present in the task table', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='The table lists Order tiles.'))
    
    async with testmu.step('Checking whether Book electrician is listed in the table'):
        set_var('book_electrician_listed', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {86: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(86).innerText.trim() === 'Book electrician');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=cell[name="Book electrician"i]'], query='whether Book electrician is present in the task table', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='The table lists Book electrician.'))
    
    async with testmu.step('Assertion check', instruction_id='d7254e4b-eb8e-4f32-abfc-15475815db1c'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'The table lists Get three quotes.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{get_three_quotes_listed}}', 'store_key': 'get_three_quotes_listed', 'variable_refs': {'{{get_three_quotes_listed}}': 'true'}}, {'description': 'The table lists Order tiles.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{order_tiles_listed}}', 'store_key': 'order_tiles_listed', 'variable_refs': {'{{order_tiles_listed}}': 'true'}}, {'description': 'The table lists Book electrician.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{book_electrician_listed}}', 'store_key': 'book_electrician_listed', 'variable_refs': {'{{book_electrician_listed}}': 'true'}}], 'sub_checks': [{'description': 'The table lists Get three quotes.', 'store_key': 'get_three_quotes_listed', 'expected_value': 'true', 'extracted_value': '{{get_three_quotes_listed}}', 'operator': 'equals', 'transforms': []}, {'description': 'The table lists Order tiles.', 'store_key': 'order_tiles_listed', 'expected_value': 'true', 'extracted_value': '{{order_tiles_listed}}', 'operator': 'equals', 'transforms': []}, {'description': 'The table lists Book electrician.', 'store_key': 'book_electrician_listed', 'expected_value': 'true', 'extracted_value': '{{book_electrician_listed}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'a table lists Get three quotes, Order tiles and Book electrician'})


if __name__ == "__main__":
    testmu.run(test)