load(
    'scripts/drone/steps/lib.star',
    'identify_runner_step',
    'wire_install_step',
    'test_backend_step',
    'test_backend_integration_step',
    'verify_gen_cue_step',
    'compile_build_cmd',
)

load(
    'scripts/drone/utils/utils.star',
    'pipeline',
)

def test_backend(trigger, ver_mode, edition="oss"):
    environment = {'EDITION': edition}
    init_steps = [
        identify_runner_step(),
        compile_build_cmd(),
        verify_gen_cue_step(edition="oss"),
        wire_install_step(),
    ]
    test_steps = [
        test_backend_step(edition),
        test_backend_integration_step(edition),
    ]

    pipeline_name = '{}-test-backend'.format(ver_mode)
    if ver_mode == 'release':
        pipeline_name = '{}-{}-test-backend'.format(ver_mode, edition)
    return pipeline(
        name=pipeline_name, edition=edition, trigger=trigger, services=[], steps=init_steps + test_steps, environment=environment
    )
