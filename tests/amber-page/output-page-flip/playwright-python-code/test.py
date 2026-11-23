import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="577825cf-4a0d-4598-a4cc-774cd74ffba3",
    name="Verify Vikunja App Sign-In and Project List",
    tc_id="TC-66",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"vikunja_app_signed_in_as_amber_demo": "true", "website_relaunch_project_in_menu": "true", "kitchen_renovation_project_in_menu": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "ghlkyp", "session_value": "ghlkyp", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/amber/', instruction_id='beba3987-a347-4469-835d-1e7f4be7169d'):
        await page.goto("http://127.0.0.1:4790/amber/")
    
    async with testmu.step('Clicking the Open the live app button', instruction_id='259c91ec-8302-4e5a-b546-c6dc503d285f'):
        _loc_1 = page.locator("internal:role=button[name=\"Open the live app\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Checking whether the signed-in Amber Demo account is shown'):
        set_var('vikunja_app_signed_in_as_amber_demo', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {31: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(31).innerText.trim() === 'Amber Demo');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['iframe[title="Vikunja running with no server"] >> internal:control=enter-frame >> internal:role=button[name="Amber Demo"i]'], query='whether the Amber Demo user account button is present in the Vikunja app header', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the block shows the Vikunja app signed in as Amber Demo.'))
    
    async with testmu.step('Checking whether Website relaunch is shown in the project menu'):
        set_var('website_relaunch_project_in_menu', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {64: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(64).innerText.trim() === 'Website relaunch');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['iframe[title="Vikunja running with no server"] >> internal:control=enter-frame >> internal:label="Projects"i >> internal:role=link[name="Website relaunch"i]'], query='whether the Website relaunch project link is present in the Projects navigation menu', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the project Website relaunch is in the Vikunja app menu.'))
    
    async with testmu.step('Checking whether Kitchen renovation is shown in the project menu'):
        set_var('kitchen_renovation_project_in_menu', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {70: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(70).innerText.trim() === 'Kitchen renovation');\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['iframe[title="Vikunja running with no server"] >> internal:control=enter-frame >> internal:label="Projects"i >> internal:role=link[name="Kitchen renovation"i]'], query='whether the Kitchen renovation project link is present in the Projects navigation menu', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the project Kitchen renovation is in the Vikunja app menu.'))
    
    async with testmu.step('Assertion check', instruction_id='d6ea7440-2abe-41d6-96cd-a87108aaac30'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the block shows the Vikunja app signed in as Amber Demo.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{vikunja_app_signed_in_as_amber_demo}}', 'store_key': 'vikunja_app_signed_in_as_amber_demo', 'variable_refs': {'{{vikunja_app_signed_in_as_amber_demo}}': 'true'}}, {'description': 'the project Website relaunch is in the Vikunja app menu.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{website_relaunch_project_in_menu}}', 'store_key': 'website_relaunch_project_in_menu', 'variable_refs': {'{{website_relaunch_project_in_menu}}': 'true'}}, {'description': 'the project Kitchen renovation is in the Vikunja app menu.', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{kitchen_renovation_project_in_menu}}', 'store_key': 'kitchen_renovation_project_in_menu', 'variable_refs': {'{{kitchen_renovation_project_in_menu}}': 'true'}}], 'sub_checks': [{'description': 'the block shows the Vikunja app signed in as Amber Demo.', 'store_key': 'vikunja_app_signed_in_as_amber_demo', 'expected_value': 'true', 'extracted_value': '{{vikunja_app_signed_in_as_amber_demo}}', 'operator': 'equals', 'transforms': []}, {'description': 'the project Website relaunch is in the Vikunja app menu.', 'store_key': 'website_relaunch_project_in_menu', 'expected_value': 'true', 'extracted_value': '{{website_relaunch_project_in_menu}}', 'operator': 'equals', 'transforms': []}, {'description': 'the project Kitchen renovation is in the Vikunja app menu.', 'store_key': 'kitchen_renovation_project_in_menu', 'expected_value': 'true', 'extracted_value': '{{kitchen_renovation_project_in_menu}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'the block now shows the Vikunja app signed in as Amber Demo, with the projects Website relaunch and Kitchen renovation in its menu.'})


if __name__ == "__main__":
    testmu.run(test)