import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="4ef6888a-65b9-4868-823a-47189c925d0a",
    name="Add and Verify Task Persistence in Project",
    tc_id="TC-31",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_amber_demo_greeting": "true", "paint_samples_project_task_list_check": "true", "paint_samples_still_listed_check": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "gwndho", "session_value": "gwndho", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='4df514d2-4908-4215-ba43-78718fcb2bf9'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for queued steps to finish', instruction_id='46eff885-d497-463e-9e4d-8abdd25da778'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='dc2afa52-c020-43fe-a470-98d70cecb436'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='447632a4-05e9-432b-8935-a68dd976e81f'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='128fc5b8-5605-4a33-a164-ac0c9e85a114'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='39c97f2b-f117-4a81-8f84-ea5d401c3a6e'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Checking whether the home page greeting for Amber Demo is present'):
        set_var('home_page_amber_demo_greeting', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim() === 'Still at it, Amber Demo?');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether the home page heading greets Amber Demo', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='2d24dcac-490a-4b8b-8841-8c3fc7e43d01'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'store_key': 'home_page_amber_demo_greeting', 'variable_refs': {'{{home_page_amber_demo_greeting}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_amber_demo_greeting', 'expected_value': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in the left projects navigation', instruction_id='f9b2fe13-a306-4628-a235-0a1836426c53'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Waiting for the plan to be queued', instruction_id='43d5b06d-ffed-4721-810b-197391614b13'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "Paint samples {{global.amber_tag}}" into "Add a task…"', instruction_id='ee91a561-f395-411c-a2a1-ef04facd307e'):
        element_4 = page.locator("internal:role=textbox[name=\"Add a task…\"i]")
        variable_value_5 = var('Paint samples {{global.amber_tag}}')
        
        await testmu.fill(element_4, variable_value_5)
    
    async with testmu.step('Click "Add"', instruction_id='4f662331-d7d3-409a-b4e9-b5b8b3761cea'):
        _loc_4 = page.locator("internal:role=button[name=\"Add\"s]")
        
        await _loc_4.click()
    
    async with testmu.step('Checking whether the Paint samples task is present in the project task list'):
        set_var('paint_samples_project_task_list_check', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {79: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(79).textContent.trim() === 'Paint samples {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Paint samples gwndho"i]'], query='whether the Paint samples {{global.amber_tag}} task link is present in the project task list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Paint samples {{global.amber_tag}} appears in the project task list.', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='ebdb28d6-032b-4775-afd9-72a57346a747'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Paint samples {{global.amber_tag}} appears in the project task list.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{paint_samples_project_task_list_check}}', 'store_key': 'paint_samples_project_task_list_check', 'variable_refs': {'{{paint_samples_project_task_list_check}}': 'true', '{{global.amber_tag}}': 'gwndho'}}], 'sub_checks': [{'description': 'Paint samples {{global.amber_tag}} appears in the project task list.', 'store_key': 'paint_samples_project_task_list_check', 'expected_value': 'true', 'extracted_value': '{{paint_samples_project_task_list_check}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Paint samples {{global.amber_tag}} appears in the project task list.'})
    
    async with testmu.step('Navigate refresh', instruction_id='67d825e3-a3fb-4168-89c1-417a81809837'):
        await page.reload()
    
    async with testmu.step('Checking whether the Paint samples task is present'):
        set_var('paint_samples_still_listed_check', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {79: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(79).innerText.trim() === 'Paint samples {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=link[name="Paint samples gwndho"i]'], query='whether the Paint samples {{global.amber_tag}} task link is present in the project task list', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='Paint samples {{global.amber_tag}} is still listed.', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='cebe1f29-97c7-4e78-b534-eecbbfa5c201'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'Paint samples {{global.amber_tag}} is still listed.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{paint_samples_still_listed_check}}', 'store_key': 'paint_samples_still_listed_check', 'variable_refs': {'{{paint_samples_still_listed_check}}': 'true', '{{global.amber_tag}}': 'gwndho'}}], 'sub_checks': [{'description': 'Paint samples {{global.amber_tag}} is still listed.', 'store_key': 'paint_samples_still_listed_check', 'expected_value': 'true', 'extracted_value': '{{paint_samples_still_listed_check}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'Paint samples {{global.amber_tag}} is still listed.'})


if __name__ == "__main__":
    testmu.run(test)