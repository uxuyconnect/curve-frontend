import { t } from '@lingui/macro'
import React, { useCallback } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { useAddRewardToken, useGaugeRewardsDistributors, useIsDepositRewardAvailable } from '@/entities/gauge'
import { addGaugeRewardTokenValidationSuite } from '@/features/add-gauge-reward-token/model'
import type { AddRewardFormValues, AddRewardTokenProps } from '@/features/add-gauge-reward-token/types'
import networks from '@/networks'
import TxInfoBar from '@/ui/TxInfoBar'

import { useSignerAddress } from '@/entities/signer'
import { DistributorInput, EstimatedGasInfo, FormActions, TokenSelector } from '@/features/add-gauge-reward-token/ui'
import { formDefaultOptions } from '@/shared/model/form'
import { FormErrorsDisplay } from 'shared/ui/forms'
import { FlexContainer, FormContainer, FormFieldsContainer } from '@/shared/ui/styled-containers'
import { vestResolver } from '@hookform/resolvers/vest'
import { zeroAddress } from 'viem'

export const AddRewardToken: React.FC<AddRewardTokenProps> = ({ chainId, poolId }) => {
  const { data: signerAddress } = useSignerAddress()

  const { isFetching: isFetchingGaugeRewardsDistributors } = useGaugeRewardsDistributors({ chainId, poolId })

  const { data: isDepositRewardAvailable, isFetching: isFetchingIsDepositRewardAvailable } =
    useIsDepositRewardAvailable({ chainId, poolId })

  const methods = useForm<AddRewardFormValues>({
    ...formDefaultOptions,
    resolver: vestResolver(addGaugeRewardTokenValidationSuite),
    defaultValues: {
      rewardTokenId: zeroAddress,
      distributorId: signerAddress ?? zeroAddress,
    },
  })
  const {
    setError,
    formState: { isSubmitting },
    handleSubmit,
  } = methods

  const {
    mutate: addRewardToken,
    isPending: isPendingAddRewardToken,
    isSuccess: isSuccessAddRewardToken,
    data: addRewardTokenData,
  } = useAddRewardToken({ chainId, poolId })

  const onSubmit = useCallback(
    ({ rewardTokenId, distributorId }: AddRewardFormValues) => {
      addRewardToken(
        { rewardTokenId, distributorId },
        {
          onError: (error: Error) => {
            setError('root.serverError', { type: 'manual', message: error.message })
          },
        }
      )
    },
    [addRewardToken, setError]
  )

  const isFormDisabled = !isDepositRewardAvailable

  const isFormLoading =
    isSubmitting || isFetchingGaugeRewardsDistributors || isFetchingIsDepositRewardAvailable || isPendingAddRewardToken

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormContainer>
          <FormFieldsContainer>
            <FlexContainer>
              <TokenSelector chainId={chainId} poolId={poolId} disabled={isFormLoading || isFormDisabled} />
              <DistributorInput disabled={isFormLoading || isFormDisabled} />
            </FlexContainer>
          </FormFieldsContainer>
          <FormErrorsDisplay errorKeys={['rewardTokenId', 'distributorId']} />
          <EstimatedGasInfo chainId={chainId} poolId={poolId} />
          <FormActions chainId={chainId} poolId={poolId} />
          {isSuccessAddRewardToken && addRewardTokenData && (
            <TxInfoBar description={t`Reward token added`} txHash={networks[chainId].scanTxPath(addRewardTokenData)} />
          )}
          <FormErrorsDisplay errorKeys={['root.serverError']} />
        </FormContainer>
      </form>
    </FormProvider>
  )
}
