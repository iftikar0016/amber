import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="90ceb6f0-d2b0-4b30-afb4-f8bb8e62ddfa",
    name="Update Task Description in Kitchen Renovation Project",
    tc_id="TC-41",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"home_page_amber_demo_greeting": "true", "task_description_shown": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "poryba", "session_value": "poryba", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/login', instruction_id='fce5a8c2-10a7-4a59-8bf7-6b1be232baff'):
        await page.goto("http://127.0.0.1:4790/login")
    
    async with testmu.step('Waiting for the queued login steps to run', instruction_id='767531f0-a5be-4ae0-8933-820c837542c6'):
        await page.wait_for_timeout(1000)
    
    async with testmu.step('Type "{{global.amber_user}}" into "Username Or Email Address"', instruction_id='10ce9885-1844-4ef4-a3d3-acab33d1d152'):
        element_0 = page.locator("internal:role=textbox[name=\"Username Or Email Address\"i]")
        variable_value_1 = var('{{global.amber_user}}')
        
        await testmu.fill(element_0, variable_value_1)
    
    async with testmu.step('Type "[REDACTED]" into "Password"', instruction_id='fc4ebed6-d5d1-409f-9ca8-c94e03c216ae'):
        element_2 = page.locator("internal:role=textbox[name=\"Password\"i]")
        variable_value_3 = var('{{secrets.user.amber_password}}')
        
        await testmu.fill(element_2, variable_value_3)
    
    async with testmu.step('Click "Stay logged in"', instruction_id='4f6da0ea-1772-47a6-9d57-3a9226b3e6c8'):
        _loc_1 = page.locator("internal:role=checkbox[name=\"Stay logged in\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Click "LOGIN"', instruction_id='09f44022-0dd4-4ebc-af34-2233b887d61a'):
        _loc_2 = page.locator("internal:role=button[name=\"Login\"i]")
        
        await _loc_2.click()
    
    async with testmu.step('Waiting for the home page greeting after signing in', instruction_id='0639cf65-affc-4dbd-be64-2f53fd5f5f4a'):
        await page.wait_for_timeout(500)
    
    async with testmu.step('Checking whether the home page greeting is present'):
        set_var('home_page_amber_demo_greeting', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {60: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(60).innerText.trim().includes('Amber Demo'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Still at it, Amber Demo?"i]'], query='whether a greeting to Amber Demo is present in the home page main heading', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the home page greets Amber Demo'))
    
    async with testmu.step('Assertion check', instruction_id='4ef7fd5f-6472-4be1-a8d0-c678daf4301b'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the home page greets Amber Demo', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'store_key': 'home_page_amber_demo_greeting', 'variable_refs': {'{{home_page_amber_demo_greeting}}': 'true'}}], 'sub_checks': [{'description': 'the home page greets Amber Demo', 'store_key': 'home_page_amber_demo_greeting', 'expected_value': 'true', 'extracted_value': '{{home_page_amber_demo_greeting}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the home page greets Amber Demo'})
    
    async with testmu.step('Clicking Kitchen renovation in the left projects list', instruction_id='4098764d-e511-4f3a-b8bf-5bcba73c3552'):
        _loc_3 = page.locator("internal:label=\"Projects\"i >> internal:role=link[name=\"Kitchen renovation\"i]")
        
        await _loc_3.click()
    
    async with testmu.step('Clicking Choose worktop link in the Kitchen renovation task list', instruction_id='a01f66cf-ddde-4dae-9147-bb932b40e36b'):
        _loc_4 = page.locator("internal:role=link[name=\"Choose worktop\"i]")
        
        await _loc_4.click()
    
    async with testmu.step('Typing Oak or quartz into the task description field', instruction_id='76752c01-b1b2-4983-b016-3264f9b86e1f'):
        element_4 = page.locator("internal:label=\"Enter a description, hit '/'\"i")
        variable_value_5 = var('Oak or quartz {{global.amber_tag}}')
        
        await testmu.fill(element_4, variable_value_5)
    
    async with testmu.step('Clicking SAVE', instruction_id='b6ab6fe0-a69c-4b8b-a4b0-09a9c4e9e344'):
        _loc_5 = page.locator("internal:role=button[name=\"Save\"i]")
        
        await _loc_5.click()
    
    async with testmu.step('Reloading the page', instruction_id='013c1115-8c0d-4018-ac06-935fa7a3286b'):
        await page.goto("http://127.0.0.1:4790/tasks/7")
    _condition_met = False
    _until_retries = 0
    while _until_retries < 10:
        print(f"[until-loop] iteration {_until_retries + 1}/10")
        async with testmu.step('Waiting for the reloaded Choose worktop page to finish loading', instruction_id='dd268df5-ca18-48b9-b194-7672ad5ec2e0'):
            await page.wait_for_timeout(500)
        await page.wait_for_timeout(500)
        if await testmu.check_until_condition(page, 'the heading "Title" is visible'):
            _condition_met = True
            break
        _until_retries += 1
    set_var("__result__", {"condition_met": _condition_met, "retries": _until_retries + 1})
    
    async with testmu.step('Checking whether the task description is present'):
        set_var('task_description_shown', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {69: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(69).innerText.trim() === 'Oak or quartz {{global.amber_tag}}');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="Oak or quartz poryba"i'], query='whether the description Oak or quartz {{global.amber_tag}} is present in the task Description section', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the description Oak or quartz {{global.amber_tag}} is shown', variables={'global.amber_tag': var('{{global.amber_tag}}')}, reprobe=True))
    
    async with testmu.step('Assertion check', instruction_id='b119b309-589d-4a26-8c93-1ab193236394'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the description Oak or quartz {{global.amber_tag}} is shown', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{task_description_shown}}', 'store_key': 'task_description_shown', 'variable_refs': {'{{task_description_shown}}': 'true', '{{global.amber_tag}}': 'poryba'}}], 'sub_checks': [{'description': 'the description Oak or quartz {{global.amber_tag}} is shown', 'store_key': 'task_description_shown', 'expected_value': 'true', 'extracted_value': '{{task_description_shown}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the description Oak or quartz {{global.amber_tag}} is shown'})


if __name__ == "__main__":
    testmu.run(test)