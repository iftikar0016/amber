import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="cddaa6b7-34e8-4814-af8a-6007e501f021",
    name="Access Kitchen Renovation Project Kanban Board",
    tc_id="TC-36",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "board_column_shown": "true", "choose_worktop_card_shown": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "kftmbx", "session_value": "kftmbx", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='4b8a0209-25bb-44ff-8e69-6b28f04fd41f'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the login form steps to finish', instruction_id='92261097-1068-4f51-9bfa-ccbd11ac2752'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='358cc9a3-f937-4bed-8188-d4267e55742d'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='d264fc4e-4d79-4f1f-9e6e-e926fccc1f74'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='51f19a18-3a52-4b18-add3-6d8f858a490d'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='b4a2a116-fb3e-4693-afc8-2a33caaa064a'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim().includes('Amber Demo'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether the home page greeting heading in the main content includes Amber Demo', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='ba00ce19-7340-4416-9ff8-120cd86ee632'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in Projects navigation', instruction_id='8678b568-4baf-4e31-a4bb-febee0a21c9a'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking Kanban tab to switch to Kanban view', instruction_id='7fb8075c-700e-432e-8548-257959cd3a59'):
        _loc_4 = page.locator("internal:role=link[name=\"Kanban\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Checking whether a board column is present'):
        set_var('board_column_shown', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {101: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (!!(el(101) && el(101).textContent.trim() && el(101).getClientRects().length));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Done"i]'], query='whether a board column headed Done is present and visible in the project board', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='a board column is shown'))
    
    async with testmu.step('Checking whether the Choose worktop card is present'):
        set_var('choose_worktop_card_shown', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {84: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (!!(el(84) && el(84).textContent.trim() === 'Choose worktop' && el(84).getClientRects().length));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Choose worktop"i]'], query='whether the card titled Choose worktop is present and visible in a board column', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='a card titled Choose worktop is shown in a board column'))
    
    async with testmu.step('Assertion check', instruction_id='8f402dce-508a-4a12-aa7e-1e0c1cce99e2'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'a board column is shown', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{board_column_shown}}', 'store_key': 'board_column_shown', 'variable_refs': {'{{board_column_shown}}': 'true'}}, {'description': 'a card titled Choose worktop is shown in a board column', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{choose_worktop_card_shown}}', 'store_key': 'choose_worktop_card_shown', 'variable_refs': {'{{choose_worktop_card_shown}}': 'true'}}], 'sub_checks': [{'description': 'a board column is shown', 'store_key': 'board_column_shown', 'expected_value': 'true', 'extracted_value': '{{board_column_shown}}', 'operator': 'equals', 'transforms': []}, {'description': 'a card titled Choose worktop is shown in a board column', 'store_key': 'choose_worktop_card_shown', 'expected_value': 'true', 'extracted_value': '{{choose_worktop_card_shown}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'a board column is shown containing a card titled Choose worktop'})


if __name__ == "__main__":
    testmu.run(test)