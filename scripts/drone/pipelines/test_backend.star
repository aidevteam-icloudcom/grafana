"""
This module returns the pipeline used for testing backend code.
"""

load(
    "scripts/drone/steps/lib.star",
    "compile_build_cmd",
    "enterprise_setup_step",
    "identify_runner_step",
    "test_backend_integration_step",
    "test_backend_step",
    "verify_gen_cue_step",
    "verify_gen_jsonnet_step",
    "wire_install_step",
)
load(
    "scripts/drone/utils/utils.star",
    "pipeline",
)

def test_backend(trigger, ver_mode):
    """Generates the pipeline used for testing OSS backend code.

    Args:
      trigger: a Drone trigger for the pipeline.
      ver_mode: affects the pipeline name.

    Returns:
      Drone pipeline.
    """
    environment = {"EDITION": "oss"}

    steps = []

    verify_step = verify_gen_cue_step()
    verify_jsonnet_step = verify_gen_jsonnet_step()

    if ver_mode == "pr":
        # In pull requests, attempt to clone grafana enterprise.
        steps.append(enterprise_setup_step())

    steps += [
        identify_runner_step(),
        compile_build_cmd(),
        verify_step,
        verify_jsonnet_step,
        wire_install_step(),
        test_backend_step(),
        test_backend_integration_step(),
    ]

    return pipeline(
        name = "{}-test-backend".format(ver_mode),
        trigger = trigger,
        steps = steps,
        environment = environment,
    )
