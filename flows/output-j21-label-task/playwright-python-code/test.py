import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="1330ac2e-0267-447a-bd8b-a8a708ffd16d",
    name="Add and Verify Task Label Persistence",
    tc_id="TC-75",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_greeting_amber_demo": "true", "task_label_urgent_global_amber_tag": "true", "task_label_urgent_global_amber_tag_persisted": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "orybah", "session_value": "orybah", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='5e1eb733-67c7-4d0e-8fd2-71bf0e131715'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for login form steps to complete', instruction_id='fe859eab-d52e-413a-814f-fd65a894f3d2'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='2279778f-354a-47c9-a9ae-ed22ff578c0e'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='3de780d3-1028-4413-9be8-7f55a70d03cb'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='844d98be-acf3-41d5-8f52-07f2509d576c'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='fe91d999-51e1-4a3b-871c-dfea71070e22'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Waiting for the home page to load after signing in', instruction_id='0c201212-2357-4979-b705-aa9895fae668'):
        await page.wait_for_timeout(500)
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_greeting_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).textContent.trim().includes('Amber Demo'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Fresh start, Amber Demo"i]'], query='whether a home page greeting for Amber Demo is present in the main content heading', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='13885043-554f-4310-bb73-481611c38b34'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'store_key': 'home_page_greeting_amber_demo', 'variable_refs': {'{{home_page_greeting_amber_demo}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_greeting_amber_demo', 'expected_value': 'true', 'extracted_value': '{{home_page_greeting_amber_demo}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in the left sidebar project list', instruction_id='695f80d7-27d4-44cb-b95d-f1f81cc75461'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking Order tiles in the Kitchen renovation task list', instruction_id='964b4487-c014-416f-85d6-c05da4e2d0d7'):
        _loc_4 = page.locator("internal:role=link[name=\"Order tiles\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Clicking Add Labels in the organization sidebar', instruction_id='c1385c21-8529-4878-ae0b-45de3ff60072'):
        _loc_5 = page.locator("internal:role=button[name=\"Add Labels\"i]")
        
        await _loc_5.click()
    
    async with testmu.step('Typing to add label in Labels section below due date', instruction_id='5b274414-c560-4854-9459-a29cc606a860'):
        element_4 = page.locator("internal:role=combobox[name=\"Type to add a label…\"i]")
        variable_value_5 = var('Urgent {{global.amber_tag}}')
        
        await testmu.fill(element_4, variable_value_5)
    
    async with testmu.step('Clicking Urgent label option to add it to the task', instruction_id='2197619d-7ea8-4df0-89bf-9aa7ff541c00'):
        _loc_6 = page.locator("internal:role=option[name=\"Urgent orybah Add this as new\"i]")
        
        await _loc_6.click()
    
    async with testmu.step('Checking whether the task label is present'):
        set_var('task_label_urgent_global_amber_tag', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {69: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(69).innerText.trim() === 'Urgent {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['div >> internal:has-text=/^Urgent orybah$/ >> nth=2'], query='whether the Urgent {{global.amber_tag}} label in the task Labels section is present', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the task shows the label Urgent {{global.amber_tag}}', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='e1209eff-e39f-4f11-89d1-27f4e37c2691'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the task shows the label Urgent {{global.amber_tag}}', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{task_label_urgent_global_amber_tag}}', 'store_key': 'task_label_urgent_global_amber_tag', 'variable_refs': {'{{task_label_urgent_global_amber_tag}}': 'true', '{{global.amber_tag}}': 'orybah'}}], 'sub_checks': [{'description': 'the task shows the label Urgent {{global.amber_tag}}', 'store_key': 'task_label_urgent_global_amber_tag', 'expected_value': 'true', 'extracted_value': '{{task_label_urgent_global_amber_tag}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the task shows the label Urgent {{global.amber_tag}}'})
    
    async with testmu.step('Navigate refresh', instruction_id='b069afe0-1540-407a-9f3b-b632dc182136'):
        await page.reload()
    
    async with testmu.step('Checking whether the task label is present'):
        set_var('task_label_urgent_global_amber_tag_persisted', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {69: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(69).innerText.trim() === 'Urgent {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['div >> internal:has-text=/^Urgent orybah$/ >> nth=2'], query='whether the label Urgent {{global.amber_tag}} is present in the Labels section of the task', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the label Urgent {{global.amber_tag}} is still shown on the task', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='714a6b3a-cdcb-40c1-a585-a0831b672c92'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the label Urgent {{global.amber_tag}} is still shown on the task', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{task_label_urgent_global_amber_tag_persisted}}', 'store_key': 'task_label_urgent_global_amber_tag_persisted', 'variable_refs': {'{{task_label_urgent_global_amber_tag_persisted}}': 'true', '{{global.amber_tag}}': 'orybah'}}], 'sub_checks': [{'description': 'the label Urgent {{global.amber_tag}} is still shown on the task', 'store_key': 'task_label_urgent_global_amber_tag_persisted', 'expected_value': 'true', 'extracted_value': '{{task_label_urgent_global_amber_tag_persisted}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the label Urgent {{global.amber_tag}} is still shown on the task'})


if __name__ == "__main__":
    testmu.run(test)