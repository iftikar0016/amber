import os
import testmu
from testmu import expect, var, set_var
from playwright.async_api import Page

testmu.configure(
    build="3f0c64d4-fc9b-4361-8b9d-975b93b5968e",
    name="Verify Comment on Task Functionality in Amber Block",
    tc_id="TC-65",
    network=os.getenv("NETWORK", "false").lower() == "true",
    variables={"side_panel_open": "true", "side_panel_heading": "Comment on a task", "capsule_fail_history": "true", "capsule_pass_history": "true"},
    global_variables=[{"id": 661733, "name": "amber_user", "value": "amber", "session_value": "amber", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}, {"id": 661734, "name": "amber_tag", "value": "yutjrb", "session_value": "yutjrb", "is_persist": False, "environment_id": 0, "environment_name": "No Env"}],
    auto_heal_version="AH2",
    default_action_timeout_ms=60000,
    default_navigation_timeout_ms=60000,
    kane_run_v4=True,
)

@testmu.test
async def test(page: Page):
    async with testmu.step('Navigate to http://127.0.0.1:4790/amber/', instruction_id='0739d836-c372-44c7-9d2f-f3b2882a3d28'):
        await page.goto("http://127.0.0.1:4790/amber/")
    
    async with testmu.step("Clicking the J15 tile to comment on Kane's evidence inside the amber block", instruction_id='e776b6c3-ccf0-4d78-85bb-a21d3025c2c7'):
        _loc_1 = page.locator("internal:role=button[name=\"Comment on a task: show Kane'\"i]")
        
        await _loc_1.click()
    
    async with testmu.step('Checking whether the side panel is open'):
        set_var('side_panel_open', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {30: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (!!(el(30).getClientRects().length && getComputedStyle(el(30)).visibility !== 'hidden' && getComputedStyle(el(30)).display !== 'none'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=complementary[name="Comment on a task"i]'], query='whether the Comment on a task side panel is visible on the page', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='a side panel opens'))
    
    async with testmu.step('Reading the side panel heading'):
        set_var('side_panel_heading', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {33: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(33).innerText.trim());\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:role=heading[name="Comment on a task"i]'], query='the heading text in the Comment on a task side panel', expected_value='Comment on a task', needs_unit_conversion=False, operator='equals', transforms=['strip'], condition='the side panel heading is Comment on a task'))
    
    async with testmu.step('Checking whether the history lists a capsule FAIL'):
        set_var('capsule_fail_history', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {40: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(40).innerText.includes('FAIL') && el(40).innerText.includes('capsule, server off'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="FAILcapsule, server off · run"i'], query='whether a FAIL entry for the capsule is listed in the history', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the history lists a FAIL for the capsule'))
    
    async with testmu.step('Checking whether the history lists a capsule PASS'):
        set_var('capsule_pass_history', await testmu.textual_analyzer(page, wrapped_js="(els) => {\n  const __m = {39: 0};\n  const el = (i) => els[__m[i]];\n  const __v = (el(39).innerText.includes('PASS') && el(39).innerText.includes('capsule, server off'));\n  return (typeof __v === 'boolean' ? String(__v) : __v);\n}", locators=['internal:text="PASScapsule, server off · run verify-2026-11-23T15-33-57runs/verify-2026-11-"i'], query='whether a PASS entry for the capsule is listed in the history', expected_value='true', needs_unit_conversion=False, operator='equals', transforms=[], condition='the history lists a PASS for the capsule'))
    
    async with testmu.step('Assertion check', instruction_id='bb2e0782-75e5-4ea9-ba95-e5c94e051a39'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'a side panel opens', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{side_panel_open}}', 'store_key': 'side_panel_open', 'variable_refs': {'{{side_panel_open}}': 'true'}}, {'description': 'the side panel heading is Comment on a task', 'passed': True, 'operator': 'equals', 'transforms': ['strip'], 'json_path': None, 'expected': 'Comment on a task', 'extracted_value': '{{side_panel_heading}}', 'store_key': 'side_panel_heading', 'variable_refs': {'{{side_panel_heading}}': 'Comment on a task'}}], 'sub_checks': [{'description': 'a side panel opens', 'store_key': 'side_panel_open', 'expected_value': 'true', 'extracted_value': '{{side_panel_open}}', 'operator': 'equals', 'transforms': []}, {'description': 'the side panel heading is Comment on a task', 'store_key': 'side_panel_heading', 'expected_value': 'Comment on a task', 'extracted_value': '{{side_panel_heading}}', 'operator': 'equals', 'transforms': ['strip']}], 'composite_operator': 'and', 'claim': 'a side panel opens with the heading Comment on a task'})
    
    async with testmu.step('Assertion check', instruction_id='e6ad1a75-4073-4888-9f43-6158263bbdc6'):
        await testmu.verify_assertion(page, 'Assertion check', {'operator': ['equals'], 'assertion_operands': [], 'left_operand': None, 'right_operand': None, 'operands': [], 'sub_results': [{'description': 'the history lists a FAIL for the capsule', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{capsule_fail_history}}', 'store_key': 'capsule_fail_history', 'variable_refs': {'{{capsule_fail_history}}': 'true'}}, {'description': 'the history lists a PASS for the capsule', 'passed': True, 'operator': 'equals', 'transforms': [], 'json_path': None, 'expected': 'true', 'extracted_value': '{{capsule_pass_history}}', 'store_key': 'capsule_pass_history', 'variable_refs': {'{{capsule_pass_history}}': 'true'}}], 'sub_checks': [{'description': 'the history lists a FAIL for the capsule', 'store_key': 'capsule_fail_history', 'expected_value': 'true', 'extracted_value': '{{capsule_fail_history}}', 'operator': 'equals', 'transforms': []}, {'description': 'the history lists a PASS for the capsule', 'store_key': 'capsule_pass_history', 'expected_value': 'true', 'extracted_value': '{{capsule_pass_history}}', 'operator': 'equals', 'transforms': []}], 'composite_operator': 'and', 'claim': 'its history lists both a FAIL and a PASS for the capsule'})


if __name__ == "__main__":
    testmu.run(test)